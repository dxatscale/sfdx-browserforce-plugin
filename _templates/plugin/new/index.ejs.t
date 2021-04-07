---
to: src/plugins/<%= h.changeCase.paramCase(name) %>/index.ts
sh: "npx eslint --fix 'src/plugins/<%= h.changeCase.paramCase(name) %>/*' 'src/plugins/index.ts' && npx prettier --write 'src/plugins/<%= h.changeCase.paramCase(name) %>/*' 'src/plugins/index.ts'"
---
import { BrowserforcePlugin } from '../../plugin';

const PATHS = {
  BASE: 'partnerbt/loginAccessPolicies.apexp'
};
const SELECTORS = {
  ENABLED: 'input[id$="adminsCanLogInAsAny"]',
  CONFIRM_MESSAGE: '.message.confirmM3',
  SAVE_BUTTON: 'input[id$=":save"]'
};

export default class <%= h.changeCase.pascalCase(name) %> extends BrowserforcePlugin {
  public async retrieve(definition?) {
    const page = await this.browserforce.openPage(PATHS.BASE);
    await page.waitForSelector(SELECTORS.ENABLED);
    const response = {
      enabled: await page.$eval(
        SELECTORS.ENABLED,
        (el: HTMLInputElement) => el.checked
      )
    };
    return response;
  }

  public async apply(config): Promise<void> {
    const page = await this.browserforce.openPage(PATHS.BASE);
    await page.waitForSelector(SELECTORS.ENABLED);
    await page.$eval(
      SELECTORS.ENABLED,
      (e: HTMLInputElement, v: boolean) => {
        e.checked = v;
      },
      config.enabled
    );
    await Promise.all([
      page.waitForSelector(SELECTORS.CONFIRM_MESSAGE),
      page.click(SELECTORS.SAVE_BUTTON)
    ]);
  }
}
