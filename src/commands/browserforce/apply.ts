import { Messages } from '@salesforce/core';
import { BrowserforceCommand } from '../../browserforce-command';
import { Flags } from '@salesforce/sf-plugins-core';
import { ux } from '@oclif/core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages(
  '@dxatscale/browserforce',
  'browserforce'
);

export default class BrowserforceApply extends BrowserforceCommand {
  public static description = messages.getMessage('applyCommandDescription');


  public static readonly flags: { [key: string]: any } = {
    'target-org': Flags.requiredOrg(
      {
        char: 'o',
      }
    ),
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
  
  public static examples = [
    `$ sf browserforce:apply -f ./config/setup-admin-login-as-any.json --targetusername myOrg@example.com
  logging in... done
  Applying definition file ./config/setup-admin-login-as-any.json to org myOrg@example.com
  [Security] retrieving state... done
  [Security] changing 'loginAccessPolicies' to '{"administratorsCanLogInAsAnyUser":true}'... done
  logging out... done
  `
  ];

  public async run(): Promise<any> {
    const { flags } = await this.parse(BrowserforceApply);
    
    ux.log(
      `Applying definition file ${
        flags.definitionfile
      } to org ${flags['target-org'].getUsername()}`
    );
    for (const setting of this.settings) {
      const driver = setting.Driver;
      const instance = new driver(this.bf, flags['target-org']);
      this.spinner.start(`[${driver.name}] retrieving state`);
      let state;
      try {
        state = await instance.retrieve(setting.value);
      } catch (err) {
       this.spinner.stop('failed');
        throw err;
      }
     this.spinner.stop();
      const action = instance.diff(state, setting.value);
     this.spinner.stop();
      if (action && Object.keys(action).length) {
        this.spinner.start(
          `[${driver.name}] ${Object.keys(action)
            .map((key) => {
              return `changing '${key}' to '${JSON.stringify(action[key])}'`;
            })
            .join('\n')}`
        );
        try {
          await instance.apply(action);
        } catch (err) {
         this.spinner.stop('failed');
          throw err;
        }
       this.spinner.stop();
      } else {
        ux.log(`[${driver.name}] no action necessary`);
      }
    }
    return { success: true };
  }
}
