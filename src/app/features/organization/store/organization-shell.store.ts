import { computed, inject, Injectable } from '@angular/core';

import { AppLanguage } from '../../../shared/models/app-language/app-language.model';
import { AppLanguageStore } from '../../../shared/store/app-language.store';

interface OrganizationShellTranslations {
  readonly closeSidebarLabel: string;
  readonly openSidebarLabel: string;
  readonly navigationLabel: string;
  readonly accountActionsLabel: string;
  readonly topbarEyebrow: string;
  readonly topbarTitle: string;
  readonly organizationLabel: string;
  readonly globalConfigurationsLabel: string;
  readonly ticketCallingManagementLabel: string;
  readonly audioAnnouncementLabel: string;
  readonly ticketStatusManagementLabel: string;
  readonly languageButtonLabel: string;
  readonly logoutLabel: string;
  readonly savedLabel: string;
  readonly savedSuccessfullyLabel: string;
  readonly organizationSetupLabel: string;
  readonly globalConfigurationsTitle: string;
  readonly globalConfigurationsDescription: string;
  readonly organizationNameLabel: string;
  readonly organizationNamePlaceholder: string;
  readonly defaultLanguageLabel: string;
  readonly timezoneLabel: string;
  readonly organizationLogoLabel: string;
  readonly urlLabel: string;
  readonly uploadFromDeviceLabel: string;
  readonly logoUrlPlaceholder: string;
  readonly uploadImagePrompt: string;
  readonly uploadImageHint: string;
  readonly saveGlobalConfigurationLabel: string;
  readonly liveLogoPreviewLabel: string;
  readonly tenantLabel: string;
  readonly languageLabel: string;
  readonly notSetLabel: string;
  readonly arabicLanguageOption: string;
  readonly englishLanguageOption: string;
  readonly queueRulesLabel: string;
  readonly ticketCallingManagementTitle: string;
  readonly ticketCallingManagementDescription: string;
  readonly queueNameLabel: string;
  readonly noShowTimeLabel: string;
  readonly noShowTimeDescription: string;
  readonly noShowTimeAriaLabel: string;
  readonly ticketLookupLabel: string;
  readonly ticketLookupDescription: string;
  readonly ticketLookupAriaLabel: string;
  readonly priorityCallingLabel: string;
  readonly priorityCallingDescription: string;
  readonly saveCallingRulesLabel: string;
  readonly mainQueueLabel: string;
  readonly noShowSecondsLabel: string;
  readonly lookupTicketsLabel: string;
  readonly voiceRulesLabel: string;
  readonly audioAnnouncementTitle: string;
  readonly audioAnnouncementDescription: string;
  readonly voiceLanguageLabel: string;
  readonly startingToneLabel: string;
  readonly customerTypeLabel: string;
  readonly appendWordNumberLabel: string;
  readonly appendWordNumberDescription: string;
  readonly previewToneLabel: string;
  readonly saveAudioRulesLabel: string;
  readonly announcementScriptLabel: string;
  readonly numberWordLabel: string;
  readonly voiceWithToneLabel: string;
  readonly toneOneLabel: string;
  readonly toneTwoLabel: string;
  readonly toneThreeLabel: string;
  readonly ticketCustomerTypeLabel: string;
  readonly customerCustomerTypeLabel: string;
  readonly patientCustomerTypeLabel: string;
  readonly statusCatalogLabel: string;
  readonly ticketStatusManagementTitle: string;
  readonly ticketStatusManagementDescription: string;
  readonly createNewStatusLabel: string;
  readonly ticketStatusListLabel: string;
  readonly idLabel: string;
  readonly nameLabel: string;
  readonly descriptionLabel: string;
  readonly colorLabel: string;
  readonly activeLabel: string;
  readonly statusNameAriaLabel: string;
  readonly statusDescriptionAriaLabel: string;
  readonly statusColorAriaLabel: string;
  readonly statusActiveAriaLabel: string;
  readonly saveStatusCatalogLabel: string;
  readonly emptyStatusesMessage: string;
  readonly emptyStatusesTitle: string;
  readonly createFirstStatusLabel: string;
  readonly defaultStatusName: string;
  readonly defaultStatusDescription: string;
}

const ORGANIZATION_SHELL_TRANSLATIONS: Record<AppLanguage, OrganizationShellTranslations> = {
  ar: {
    closeSidebarLabel: '\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062c\u0627\u0646\u0628\u064a\u0629',
    openSidebarLabel: '\u0641\u062a\u062d \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062c\u0627\u0646\u0628\u064a\u0629',
    navigationLabel: '\u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0645\u0624\u0633\u0633\u0629',
    accountActionsLabel: '\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0627\u0644\u062d\u0633\u0627\u0628',
    topbarEyebrow: '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645',
    topbarTitle: '\u0627\u0644\u0645\u0624\u0633\u0633\u0629',
    organizationLabel: '\u0627\u0644\u0645\u0624\u0633\u0633\u0629',
    globalConfigurationsLabel: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629',
    ticketCallingManagementLabel: '\u0625\u062f\u0627\u0631\u0629 \u0646\u062f\u0627\u0621 \u0627\u0644\u062a\u0630\u0627\u0643\u0631',
    audioAnnouncementLabel: '\u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0627\u0644\u0635\u0648\u062a\u064a',
    ticketStatusManagementLabel: '\u0625\u062f\u0627\u0631\u0629 \u062d\u0627\u0644\u0627\u062a \u0627\u0644\u062a\u0630\u0627\u0643\u0631',
    languageButtonLabel: 'English',
    logoutLabel: '\u062a\u0633\u062c\u064a\u0644 \u062e\u0631\u0648\u062c',
    savedLabel: '\u062a\u0645 \u0627\u0644\u062d\u0641\u0638',
    savedSuccessfullyLabel: '\u062a\u0645 \u0627\u0644\u062d\u0641\u0638 \u0628\u0646\u062c\u0627\u062d',
    organizationSetupLabel: '\u0625\u0639\u062f\u0627\u062f \u0627\u0644\u0645\u0624\u0633\u0633\u0629',
    globalConfigurationsTitle: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629',
    globalConfigurationsDescription: '\u0625\u062f\u0627\u0631\u0629 \u0647\u0648\u064a\u0629 \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0648\u0627\u0644\u0644\u063a\u0629 \u0648\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0632\u0645\u0646\u064a\u0629 \u0648\u0634\u0639\u0627\u0631 \u0627\u0644\u0645\u0624\u0633\u0633\u0629.',
    organizationNameLabel: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0624\u0633\u0633\u0629',
    organizationNamePlaceholder: '\u0645\u062b\u0627\u0644: Hayah Clinic',
    defaultLanguageLabel: '\u0627\u0644\u0644\u063a\u0629 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629',
    timezoneLabel: '\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0632\u0645\u0646\u064a\u0629',
    organizationLogoLabel: '\u0634\u0639\u0627\u0631 \u0627\u0644\u0645\u0624\u0633\u0633\u0629',
    urlLabel: '\u0631\u0627\u0628\u0637',
    uploadFromDeviceLabel: '\u0631\u0641\u0639 \u0645\u0646 \u0627\u0644\u062c\u0647\u0627\u0632',
    logoUrlPlaceholder: '/images/logo.png',
    uploadImagePrompt: '\u0627\u0636\u063a\u0637 \u0623\u0648 \u0627\u0633\u062d\u0628 \u0635\u0648\u0631\u0629 \u0647\u0646\u0627',
    uploadImageHint: 'PNG \u0623\u0648 JPG \u0623\u0648 SVG \u062d\u062a\u0649 2MB',
    saveGlobalConfigurationLabel: '\u062d\u0641\u0638 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629',
    liveLogoPreviewLabel: '\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0634\u0639\u0627\u0631 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629',
    tenantLabel: '\u0627\u0644\u0645\u0624\u0633\u0633\u0629',
    languageLabel: '\u0627\u0644\u0644\u063a\u0629',
    notSetLabel: '\u063a\u064a\u0631 \u0645\u062d\u062f\u062f',
    arabicLanguageOption: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
    englishLanguageOption: '\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629',
    queueRulesLabel: '\u0642\u0648\u0627\u0639\u062f \u0627\u0644\u0637\u0627\u0628\u0648\u0631',
    ticketCallingManagementTitle: '\u0625\u062f\u0627\u0631\u0629 \u0646\u062f\u0627\u0621 \u0627\u0644\u062a\u0630\u0627\u0643\u0631',
    ticketCallingManagementDescription: '\u0627\u0644\u062a\u062d\u0643\u0645 \u0641\u064a \u0632\u0645\u0646 \u0639\u062f\u0645 \u0627\u0644\u062d\u0636\u0648\u0631 \u0648\u0628\u062d\u062b \u0627\u0644\u062a\u0630\u0627\u0643\u0631 \u0648\u0633\u0644\u0648\u0643 \u0627\u0644\u0637\u0627\u0628\u0648\u0631.',
    queueNameLabel: '\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0628\u0648\u0631',
    noShowTimeLabel: '\u0648\u0642\u062a \u0639\u062f\u0645 \u0627\u0644\u062d\u0636\u0648\u0631',
    noShowTimeDescription: '\u0639\u062f\u062f \u0627\u0644\u062b\u0648\u0627\u0646\u064a \u0642\u0628\u0644 \u0627\u0639\u062a\u0628\u0627\u0631 \u0627\u0644\u062a\u0630\u0643\u0631\u0629 \u0641\u0627\u0626\u062a\u0629.',
    noShowTimeAriaLabel: '\u0648\u0642\u062a \u0639\u062f\u0645 \u0627\u0644\u062d\u0636\u0648\u0631 \u0628\u0627\u0644\u062b\u0648\u0627\u0646\u064a',
    ticketLookupLabel: '\u0627\u0644\u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u062a\u0630\u0627\u0643\u0631',
    ticketLookupDescription: '\u0639\u062f\u062f \u0627\u0644\u062a\u0630\u0627\u0643\u0631 \u0627\u0644\u0645\u062a\u0627\u062d\u0629 \u0644\u0644\u0628\u062d\u062b.',
    ticketLookupAriaLabel: '\u0639\u062f\u062f \u0627\u0644\u062a\u0630\u0627\u0643\u0631 \u0644\u0644\u0628\u062d\u062b',
    priorityCallingLabel: '\u0627\u0644\u0646\u062f\u0627\u0621 \u0628\u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0629',
    priorityCallingDescription: '\u0627\u0644\u0633\u0645\u0627\u062d \u0644\u0644\u062a\u0630\u0627\u0643\u0631 \u0627\u0644\u0639\u0627\u062c\u0644\u0629 \u0628\u062a\u062c\u0627\u0648\u0632 \u062a\u0631\u062a\u064a\u0628 \u0627\u0644\u0646\u062f\u0627\u0621.',
    saveCallingRulesLabel: '\u062d\u0641\u0638 \u0642\u0648\u0627\u0639\u062f \u0627\u0644\u0646\u062f\u0627\u0621',
    mainQueueLabel: '\u0627\u0644\u0637\u0627\u0628\u0648\u0631 \u0627\u0644\u0631\u0626\u064a\u0633\u064a',
    noShowSecondsLabel: '\u062b\u0648\u0627\u0646\u064a \u0639\u062f\u0645 \u0627\u0644\u062d\u0636\u0648\u0631',
    lookupTicketsLabel: '\u062a\u0630\u0627\u0643\u0631 \u0627\u0644\u0628\u062d\u062b',
    voiceRulesLabel: '\u0642\u0648\u0627\u0639\u062f \u0627\u0644\u0635\u0648\u062a',
    audioAnnouncementTitle: '\u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0627\u0644\u0635\u0648\u062a\u064a',
    audioAnnouncementDescription: '\u0625\u0639\u062f\u0627\u062f \u0627\u0644\u0644\u063a\u0629 \u0648\u0627\u0644\u0646\u063a\u0645\u0629 \u0648\u0635\u064a\u063a\u0629 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u062a\u0630\u0643\u0631\u0629.',
    voiceLanguageLabel: '\u0644\u063a\u0629 \u0627\u0644\u0635\u0648\u062a',
    startingToneLabel: '\u0646\u063a\u0645\u0629 \u0627\u0644\u0628\u062f\u0627\u064a\u0629',
    customerTypeLabel: '\u0646\u0648\u0639 \u0627\u0644\u0639\u0645\u064a\u0644',
    appendWordNumberLabel: '\u0625\u0636\u0627\u0641\u0629 \u0643\u0644\u0645\u0629 \u0631\u0642\u0645',
    appendWordNumberDescription: '\u0625\u0636\u0627\u0641\u0629 \u0643\u0644\u0645\u0629 "\u0631\u0642\u0645" \u0642\u0628\u0644 \u0642\u0631\u0627\u0621\u0629 \u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u062a\u0630\u0643\u0631\u0629.',
    previewToneLabel: '\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0646\u063a\u0645\u0629',
    saveAudioRulesLabel: '\u062d\u0641\u0638 \u0642\u0648\u0627\u0639\u062f \u0627\u0644\u0635\u0648\u062a',
    announcementScriptLabel: '\u0646\u0635 \u0627\u0644\u0625\u0639\u0644\u0627\u0646',
    numberWordLabel: '\u0631\u0642\u0645',
    voiceWithToneLabel: '\u0635\u0648\u062a \u0645\u0639',
    toneOneLabel: '\u0627\u0644\u0646\u063a\u0645\u0629 1',
    toneTwoLabel: '\u0627\u0644\u0646\u063a\u0645\u0629 2',
    toneThreeLabel: '\u0627\u0644\u0646\u063a\u0645\u0629 3',
    ticketCustomerTypeLabel: '\u062a\u0630\u0643\u0631\u0629',
    customerCustomerTypeLabel: '\u0639\u0645\u064a\u0644',
    patientCustomerTypeLabel: '\u0645\u0631\u064a\u0636',
    statusCatalogLabel: '\u0643\u062a\u0627\u0644\u0648\u062c \u0627\u0644\u062d\u0627\u0644\u0627\u062a',
    ticketStatusManagementTitle: '\u0625\u062f\u0627\u0631\u0629 \u062d\u0627\u0644\u0627\u062a \u0627\u0644\u062a\u0630\u0627\u0643\u0631',
    ticketStatusManagementDescription: '\u0625\u0646\u0634\u0627\u0621 \u0648\u062a\u062d\u062f\u064a\u062b \u062d\u0627\u0644\u0627\u062a \u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u062a\u0630\u0627\u0643\u0631 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0629 \u0641\u064a \u0627\u0644\u062a\u0634\u063a\u064a\u0644.',
    createNewStatusLabel: '\u0625\u0646\u0634\u0627\u0621 \u062d\u0627\u0644\u0629 \u062c\u062f\u064a\u062f\u0629',
    ticketStatusListLabel: '\u0642\u0627\u0626\u0645\u0629 \u062d\u0627\u0644\u0627\u062a \u0627\u0644\u062a\u0630\u0627\u0643\u0631',
    idLabel: '\u0627\u0644\u0645\u0639\u0631\u0641',
    nameLabel: '\u0627\u0644\u0627\u0633\u0645',
    descriptionLabel: '\u0627\u0644\u0648\u0635\u0641',
    colorLabel: '\u0627\u0644\u0644\u0648\u0646',
    activeLabel: '\u0646\u0634\u0637',
    statusNameAriaLabel: '\u0627\u0633\u0645 \u0627\u0644\u062d\u0627\u0644\u0629',
    statusDescriptionAriaLabel: '\u0648\u0635\u0641 \u0627\u0644\u062d\u0627\u0644\u0629',
    statusColorAriaLabel: '\u0644\u0648\u0646 \u0627\u0644\u062d\u0627\u0644\u0629',
    statusActiveAriaLabel: '\u0627\u0644\u062d\u0627\u0644\u0629 \u0646\u0634\u0637\u0629',
    saveStatusCatalogLabel: '\u062d\u0641\u0638 \u0643\u062a\u0627\u0644\u0648\u062c \u0627\u0644\u062d\u0627\u0644\u0627\u062a',
    emptyStatusesMessage: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u0627\u0644\u0627\u062a \u062a\u0630\u0627\u0643\u0631 \u0645\u0636\u0627\u0641\u0629 \u062d\u062a\u0649 \u0627\u0644\u0622\u0646.',
    emptyStatusesTitle: '\u0627\u0628\u062f\u0623 \u0628\u0628\u0646\u0627\u0621 \u0643\u062a\u0627\u0644\u0648\u062c \u062d\u0627\u0644\u0627\u062a \u0627\u0644\u0625\u063a\u0644\u0627\u0642 \u0644\u0633\u064a\u0631 \u0627\u0644\u0639\u0645\u0644.',
    createFirstStatusLabel: '\u0625\u0646\u0634\u0627\u0621 \u0623\u0648\u0644 \u062d\u0627\u0644\u0629',
    defaultStatusName: '\u062d\u0627\u0644\u0629 \u062c\u062f\u064a\u062f\u0629',
    defaultStatusDescription: '\u0635\u0641 \u0645\u062a\u0649 \u064a\u062c\u0628 \u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0647\u0630\u0647 \u0627\u0644\u062d\u0627\u0644\u0629.'
  },
  en: {
    closeSidebarLabel: 'Close sidebar',
    openSidebarLabel: 'Open sidebar',
    navigationLabel: 'Organization pages',
    accountActionsLabel: 'Account actions',
    topbarEyebrow: 'Dashboard',
    topbarTitle: 'Organization',
    organizationLabel: 'Organization',
    globalConfigurationsLabel: 'Global Configurations',
    ticketCallingManagementLabel: 'Ticket Calling Management',
    audioAnnouncementLabel: 'Audio Announcement',
    ticketStatusManagementLabel: 'Ticket-Status Management',
    languageButtonLabel: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
    logoutLabel: 'Logout',
    savedLabel: 'Saved',
    savedSuccessfullyLabel: 'Saved Successfully',
    organizationSetupLabel: 'Organization Setup',
    globalConfigurationsTitle: 'Global Configurations',
    globalConfigurationsDescription: 'Manage tenant identity, language, timezone, and brand assets.',
    organizationNameLabel: 'Organization Name',
    organizationNamePlaceholder: 'e.g. Hayah Clinic',
    defaultLanguageLabel: 'Default Language',
    timezoneLabel: 'Timezone',
    organizationLogoLabel: 'Organization Logo',
    urlLabel: 'URL',
    uploadFromDeviceLabel: 'Upload from Device',
    logoUrlPlaceholder: '/images/logo.png',
    uploadImagePrompt: 'Click or drag & drop an image',
    uploadImageHint: 'PNG, JPG, SVG up to 2MB',
    saveGlobalConfigurationLabel: 'Save Global Configuration',
    liveLogoPreviewLabel: 'Live Logo Preview',
    tenantLabel: 'Tenant',
    languageLabel: 'Language',
    notSetLabel: 'Not Set',
    arabicLanguageOption: 'Arabic',
    englishLanguageOption: 'English',
    queueRulesLabel: 'Queue Rules',
    ticketCallingManagementTitle: 'Ticket Calling Management',
    ticketCallingManagementDescription: 'Control no-show timing, ticket lookup depth, and active queue behavior.',
    queueNameLabel: 'Queue Name',
    noShowTimeLabel: 'No-Show Time',
    noShowTimeDescription: 'Seconds before ticket is treated as missed.',
    noShowTimeAriaLabel: 'No-show time in seconds',
    ticketLookupLabel: 'Ticket Look-up',
    ticketLookupDescription: 'How many tickets can be searched ahead.',
    ticketLookupAriaLabel: 'Ticket lookup count',
    priorityCallingLabel: 'Priority Calling',
    priorityCallingDescription: 'Allow urgent tickets to jump the calling order.',
    saveCallingRulesLabel: 'Save Calling Rules',
    mainQueueLabel: 'Main Queue',
    noShowSecondsLabel: 'No-show seconds',
    lookupTicketsLabel: 'Lookup tickets',
    voiceRulesLabel: 'Voice Rules',
    audioAnnouncementTitle: 'Audio Announcement',
    audioAnnouncementDescription: 'Configure the language, tone, and spoken ticket format.',
    voiceLanguageLabel: 'Voice Language',
    startingToneLabel: 'Starting Tone',
    customerTypeLabel: 'Customer Type',
    appendWordNumberLabel: 'Append Word Number',
    appendWordNumberDescription: 'Add the word "Number" before reading ticket digits.',
    previewToneLabel: 'Preview Tone',
    saveAudioRulesLabel: 'Save Audio Rules',
    announcementScriptLabel: 'Announcement Script',
    numberWordLabel: 'Number',
    voiceWithToneLabel: 'voice with',
    toneOneLabel: 'Tone 1',
    toneTwoLabel: 'Tone 2',
    toneThreeLabel: 'Tone 3',
    ticketCustomerTypeLabel: 'Ticket',
    customerCustomerTypeLabel: 'Customer',
    patientCustomerTypeLabel: 'Patient',
    statusCatalogLabel: 'Status Catalog',
    ticketStatusManagementTitle: 'Ticket-Status Management',
    ticketStatusManagementDescription: 'Create and maintain closing statuses used by operation teams.',
    createNewStatusLabel: 'Create New Status',
    ticketStatusListLabel: 'Ticket status list',
    idLabel: 'ID',
    nameLabel: 'Name',
    descriptionLabel: 'Description',
    colorLabel: 'Color',
    activeLabel: 'Active',
    statusNameAriaLabel: 'Status name',
    statusDescriptionAriaLabel: 'Status description',
    statusColorAriaLabel: 'Status color',
    statusActiveAriaLabel: 'Status active',
    saveStatusCatalogLabel: 'Save Status Catalog',
    emptyStatusesMessage: 'No ticket statuses configured yet.',
    emptyStatusesTitle: 'Build the closing status catalog for your operation flow.',
    createFirstStatusLabel: 'Create First Status',
    defaultStatusName: 'New Status',
    defaultStatusDescription: 'Describe when this ticket status should be used.'
  }
};

@Injectable()
export class OrganizationShellStore {
  private readonly appLanguageStore = inject(AppLanguageStore);

  readonly language = this.appLanguageStore.language;
  readonly direction = this.appLanguageStore.direction;
  readonly translations = computed(() => ORGANIZATION_SHELL_TRANSLATIONS[this.appLanguageStore.language()]);

  toggleLanguage(): void {
    this.appLanguageStore.toggleLanguage();
  }
}


