import { writeFile } from 'fs/promises';
import { Messages } from '@salesforce/core';
import * as path from 'path';
import { BrowserforceCommand } from '../../browserforce-command';
import {  ux } from '@oclif/core';
import { Flags, requiredOrgFlagWithDeprecations } from '@salesforce/sf-plugins-core';


Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages(
  '@dxatscale/browserforce',
  'browserforce'
);


export default class BrowserforcePlanCommand extends BrowserforceCommand {
  public static description = messages.getMessage('planCommandDescription');

  public static examples = [
    `$ sf browserforce:plan -f ./config/setup-admin-login-as-any.json --targetusername myOrg@example.com
  logging in... done
  Generating plan with definition file ./config/setup-admin-login-as-any.json from org myOrg@example.com
  [Security] retrieving state... done
  [Security] generating plan... done
  logging out... done
  `
  ];

  public static readonly flags: { [key: string]: any } = {
    'target-org': requiredOrgFlagWithDeprecations,
    definitionfile: Flags.string({
      char: 'f',
      description: messages.getMessage('definitionFileDescription')
    }),
    planfile: Flags.string({
      char: 'p',
      name: 'plan',
      description: messages.getMessage('planFileDescription')
    }),
    statefile: Flags.string({
      char: 's',
      name: 'state',
      description: messages.getMessage('stateFileDescription')
    })
  };

  public async run(): Promise<any> {
    const { flags } = await this.parse(BrowserforcePlanCommand);

    ux.log(
      `Generating plan with definition file ${
        flags.definitionfile
      } from org ${flags['target-org'].getUsername()}`
    );
    const state = {
      settings: {}
    };
    const plan = {
      settings: {}
    };
    for (const setting of this.settings) {
      const driver = setting.Driver;
      const instance = new driver(this.bf, flags['target-org']);
    this.spinner.start(`[${driver.name}] retrieving state`);
      let driverState;
      try {
        driverState = await instance.retrieve(setting.value);
        state.settings[setting.key] = driverState;
      } catch (err) {
       this.spinner.stop('failed');
        throw err;
      }
     this.spinner.stop();
    this.spinner.start(`[${driver.name}] generating plan`);
      const driverPlan = instance.diff(driverState, setting.value);
      plan.settings[setting.key] = driverPlan;
     this.spinner.stop();
    }
    if (flags.statefile) {
    this.spinner.start('writing state file');
      await writeFile(
        path.resolve(flags.statefile),
        JSON.stringify(state, null, 2)
      );
     this.spinner.stop();
    }
    if (flags.planfile) {
    this.spinner.start('writing plan file');
      await writeFile(
        path.resolve(flags.planfile),
        JSON.stringify(plan, null, 2)
      );
     this.spinner.stop();
    }
    return { success: true, plan };
  }
}
