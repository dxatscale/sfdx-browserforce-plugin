import type { Record } from 'jsforce';
import * as jsonMergePatch from 'json-merge-patch';
import pRetry, { AbortError } from 'p-retry';
import { BrowserforcePlugin } from '../../../plugin';
import { removeNullValues } from '../../utils';

const PATHS = {
  EDIT_VIEW: 'setup/secur/idp/IdpPage.apexp'
};
const SELECTORS = {
  CHOOSE_CERT: 'select[id$=":chooseCert"]',
  CERT_NAME_SPAN: 'span[id$="developer__name"',
  DISABLE_BUTTON: 'input[name$=":disable"]',
  EDIT_BUTTON: 'input[name$=":edit"]',
  SAVE_BUTTON: 'input[name$=":save"]'
};

interface CertificateRecord extends Record {
  DeveloperName: string;
  NamespacePrefix: string;
}

export type Config = {
  enabled?: boolean;
  certificate?: string;
};

export class IdentityProvider extends BrowserforcePlugin {
  public async retrieve(definition?: Config): Promise<Config> {
    const page = await this.browserforce.openPage(PATHS.EDIT_VIEW);
    await page.waitForSelector(SELECTORS.EDIT_BUTTON);
    const disableButton = await page.$(SELECTORS.DISABLE_BUTTON);
    const certNameHandle = await page.$(SELECTORS.CERT_NAME_SPAN);
    const response = {
      enabled: disableButton !== null
    };
    if (certNameHandle) {
      response['certificate'] = await page.evaluate(
        (span: HTMLSpanElement) => span.innerText,
        certNameHandle
      );
    }
    return response;
  }

  public diff(state: Config, definition: Config): Config {
    return removeNullValues(jsonMergePatch.generate(state, definition));
  }

  public async apply(plan: Config): Promise<void> {
    if (plan.enabled && plan.certificate && plan.certificate !== '') {
      // wait for cert to become available in Identity Provider UI
      await pRetry(
        async () => {
          const certsResponse = await this.org
            .getConnection()
            .tooling.query<CertificateRecord>(
              `SELECT Id, DeveloperName FROM Certificate WHERE DeveloperName = '${plan.certificate}'`
            );
          if (!certsResponse.totalSize) {
            throw new AbortError(
              `Could not find Certificate '${plan.certificate}'`
            );
          }
          const page = await this.browserforce.openPage(PATHS.EDIT_VIEW);
          await page.waitForSelector(SELECTORS.EDIT_BUTTON);
          await Promise.all([
            page.waitForNavigation(),
            page.click(SELECTORS.EDIT_BUTTON)
          ]);
          await page.waitForSelector(SELECTORS.CHOOSE_CERT);
          const chooseCertOptions = await page.$$eval(
            `${SELECTORS.CHOOSE_CERT} option`,
            (options: HTMLOptionElement[]) => {
              return options.map(option => {
                return {
                  text: option.text,
                  value: option.value
                };
              });
            }
          );
          const chooseCertOption = chooseCertOptions.find(
            x => x.text === plan.certificate
          );
          if (!chooseCertOption) {
            throw new Error(
              `Waiting for Certificate '${plan.certificate}' to be available in Identity Provider picklist timed out`
            );
          }
          await page.select(SELECTORS.CHOOSE_CERT, chooseCertOption.value);
          page.on('dialog', async dialog => {
            await dialog.accept();
          });
          await page.waitForSelector(SELECTORS.SAVE_BUTTON);
          await Promise.all([
            page.waitForNavigation(),
            page.click(SELECTORS.SAVE_BUTTON)
          ]);
        },
        {
          retries: 5,
          minTimeout: 2 * 1000
        }
      );
    } else {
      const page = await this.browserforce.openPage(PATHS.EDIT_VIEW);
      await page.waitForSelector(SELECTORS.EDIT_BUTTON);
      await page.$(SELECTORS.DISABLE_BUTTON);
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      await Promise.all([
        page.waitForNavigation(),
        page.click(SELECTORS.DISABLE_BUTTON)
      ]);
    }
  }
}
