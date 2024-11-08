import TelemetryReporter from "@vscode/extension-telemetry";
import * as vscode from "vscode";

import { extensionId, treeViewId } from "../../constants";
import { setDeepLinkParams } from "../../handlers/deepLinkParamsHandler";
import { searchSteps } from "../../modules/steps/searchSteps";
import { OpenApiTreeProvider } from "../../providers/openApiTreeProvider";
import { getExtensionSettings } from "../../types/extensionSettings";
import { IntegrationParams, validateDeepLinkQueryParams } from "../../utilities/deep-linking";
import { openTreeViewWithProgress } from "../../utilities/progress";
import { Command } from "../Command";
import { searchDescription } from "./searchDescription";

export class SearchOrOpenApiDescriptionCommand extends Command {

  private _openApiTreeProvider: OpenApiTreeProvider;
  private _context: vscode.ExtensionContext;

  constructor(openApiTreeProvider: OpenApiTreeProvider, context: vscode.ExtensionContext) {
    super();
    this._openApiTreeProvider = openApiTreeProvider;
    this._context = context;
  }

  public getName(): string {
    return `${treeViewId}.searchOrOpenApiDescription`;
  }

  public async execute(searchParams: Partial<IntegrationParams>): Promise<void> {
    // set deeplink params if exists
    if (Object.keys(searchParams).length > 0) {
      let [params, errorsArray] = validateDeepLinkQueryParams(searchParams);
      setDeepLinkParams(params);
      const reporter = new TelemetryReporter(this._context.extension.packageJSON.telemetryInstrumentationKey);
      reporter.sendTelemetryEvent("DeepLinked searchOrOpenApiDescription", {
        "searchParameters": JSON.stringify(searchParams),
        "validationErrors": errorsArray.join(", ")
      });
    }

    // proceed to enable loading of openapi description
    const yesAnswer = vscode.l10n.t("Yes, override it");
    if (this._openApiTreeProvider.hasChanges()) {
      const response = await vscode.window.showWarningMessage(
        vscode.l10n.t(
          "Before adding a new API description, consider that your changes and current selection will be lost."),
        yesAnswer,
        vscode.l10n.t("Cancel")
      );
      if (response !== yesAnswer) {
        return;
      }
    }

    const config = await searchSteps(x => vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      cancellable: false,
      title: vscode.l10n.t("Searching...")
    }, (progress, _) => {
      const settings = getExtensionSettings(extensionId);
      return searchDescription(this._context, x, settings.clearCache);
    }));

    if (config.descriptionPath) {
      await openTreeViewWithProgress(() => this._openApiTreeProvider.setDescriptionUrl(config.descriptionPath!));
    }
    await vscode.window.showInformationMessage(vscode.l10n.t('You can now select the required endpoints from {0}', this._openApiTreeProvider.apiTitle!));
  }
}
