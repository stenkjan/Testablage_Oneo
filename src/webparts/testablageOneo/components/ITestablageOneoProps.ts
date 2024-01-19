import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface ITestablageOneoProps {
  context: WebPartContext;
  description: string;
  siteUrl: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
}
