import type { Record } from 'jsforce';
import * as jsonMergePatch from 'json-merge-patch';
import { BrowserforcePlugin } from '../../plugin';

const PATHS = {
  BASE: 'setup/ui/assignhomelayoutedit.jsp'
};
const SELECTORS = {
  BASE: 'table.detailList',
  SAVE_BUTTON: 'input[name="save"]'
};

interface ProfileRecord extends Record {
  Name: string;
}

interface HomePageLayoutRecord extends Record {
  Name: string;
}

type Config = {
  homePageLayoutAssignments: HomePageLayoutAssignment[];
};

type HomePageLayoutAssignment = {
  profile: string;
  layout: string;
};

export class HomePageLayouts extends BrowserforcePlugin {
  public async retrieve(definition?: Config): Promise<Config> {
    const page = await this.browserforce.openPage(PATHS.BASE);
    await page.waitForSelector(SELECTORS.BASE);
    const profiles = await page.$$eval(
      'table.detailList tbody tr td label',
      (labels: HTMLLabelElement[]) => {
        return labels.map((label) => {
          for (let i = 0; label.childNodes.length; i++) {
            if (label.childNodes[i].nodeType === label.TEXT_NODE) {
              return label.childNodes[i].nodeValue;
            }
          }
          throw new Error('retrieving HomePageLayouts failed');
        });
      }
    );
    const layouts = await page.$$eval(
      'table.detailList tbody tr td select',
      (selects: HTMLSelectElement[]) => {
        return selects
          .map((select) => select.selectedOptions[0].text)
          .map((text) => (text === 'Home Page Default' ? '' : text));
      }
    );
    const homePageLayoutAssignments = [];
    for (let i = 0; i < profiles.length; i++) {
      homePageLayoutAssignments.push({
        profile: profiles[i],
        layout: layouts[i]
      });
    }
    return {
      homePageLayoutAssignments
    };
  }

  public diff(source: Config, target: Config): Config {
    const profileNames = target.homePageLayoutAssignments.map(
      (assignment) => assignment.profile
    );
    source.homePageLayoutAssignments = source.homePageLayoutAssignments.filter(
      (assignment) => profileNames.includes(assignment.profile)
    );
    return jsonMergePatch.generate(source, target);
  }

  public async apply(config: Config): Promise<void> {
    const profilesList = config.homePageLayoutAssignments
      .map((assignment) => {
        return `'${assignment.profile}'`;
      })
      .join(',');
    const layoutsList = config.homePageLayoutAssignments
      .map((assignment) => {
        return `'${assignment.layout}'`;
      })
      .join(',');
    const profiles = await this.org
      .getConnection()
      .tooling.query<ProfileRecord>(
        `SELECT Id, Name FROM Profile WHERE Name IN (${profilesList})`
      );
    const homePageLayouts = await this.org
      .getConnection()
      .tooling.query<HomePageLayoutRecord>(
        `SELECT Id, Name FROM HomePageLayout WHERE Name IN (${layoutsList})`
      );

    const page = await this.browserforce.openPage(PATHS.BASE);
    await page.waitForSelector(SELECTORS.BASE);
    for (const assignment of config.homePageLayoutAssignments) {
      const homePageLayoutName = assignment.layout;
      const profile = profiles.records.find(
        (p) => p.Name === assignment.profile
      );
      if (!profile) {
        throw new Error(`could not find profile '${assignment.profile}'`);
      }
      let homePageLayout = homePageLayouts.records.find(
        (l) => l.Name === homePageLayoutName
      );
      if (homePageLayoutName === '') {
        homePageLayout = { Id: 'default', Name: 'default' };
      }
      const profileSelector = `select[id='${profile.Id.substring(0, 15)}']`;
      await page.waitForSelector(profileSelector);
      await page.select(profileSelector, homePageLayout.Id.substring(0, 15));
    }
    await Promise.all([
      page.waitForNavigation(),
      page.click(SELECTORS.SAVE_BUTTON)
    ]);
  }
}
