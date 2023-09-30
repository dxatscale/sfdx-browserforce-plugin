import { Messages, } from '@salesforce/core';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { promises } from 'fs';
import * as path from 'path';
import { Browserforce } from './browserforce';
import { ConfigParser } from './config-parser';
import * as DRIVERS from './plugins';
import { ux } from '@oclif/core';
import { Flags } from '@salesforce/sf-plugins-core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages(
  '@dxatscale/browserforce',
  'browserforce'
);

export class BrowserforceCommand extends SfCommand<void> {
  protected static requiresUsername = true;

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
 


  protected bf: Browserforce;
  protected settings: any[];

  public async init(): Promise<void> {
    await super.init();
    const { flags } = await this.parse(BrowserforceCommand);
    const definitionFileData = await promises.readFile(
      path.resolve(flags.definitionfile),
      'utf8'
    );
    let definition;
    try {
      definition = JSON.parse(definitionFileData); 
    } catch (err) {
      throw new Error('Failed parsing definitionfile');
    }
    // TODO: use require.resolve to dynamically load plugins from npm packages
    this.settings = ConfigParser.parse(DRIVERS, definition);
    this.bf = new Browserforce(flags['target-org'], ux);
    this.spinner.start('logging in');
    await this.bf.login();
    this.spinner.stop();
  }

  public async run(): Promise<void> {
    throw new Error('BrowserforceCommand should not be run directly');
  }

  public async finally(err: Error): Promise<void> {
    this.spinner.stop();
    if (this.bf) {
      this.spinner.start('logging out');
      await this.bf.logout();
      this.spinner.stop();
    }
  }
}
