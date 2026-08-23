import { computed, inject, Injectable } from '@angular/core';

import { AppLanguage } from '../../../shared/models/app-language.model';
import { AppLanguageStore } from '../../../shared/store/app-language.store';

interface TechnicalAdminTranslations {
  readonly closeSidebarLabel: string;
  readonly openSidebarLabel: string;
  readonly navigationLabel: string;
  readonly accountActionsLabel: string;
  readonly topbarEyebrow: string;
  readonly topbarTitle: string;
  readonly languageButtonLabel: string;
  readonly logoutLabel: string;
  readonly currentUserLabel: string;
  readonly technicalAdminRoleLabel: string;
  readonly branchAdminRoleLabel: string;
  readonly organizationAdminRoleLabel: string;
  readonly themeConfigurationLabel: string;
  readonly generalLabel: string;
  readonly serviceRequestLabel: string;
  readonly branchManagementLabel: string;
  readonly selectedBranchLabel: string;
  readonly branchNavigationLabel: string;
  readonly openBranchNavigationLabel: string;
  readonly closeBranchNavigationLabel: string;
  readonly backToBranchesLabel: string;
  readonly activeBranchLabel: string;
  readonly inactiveBranchLabel: string;
  readonly branchEditorLabel: string;
  readonly branchBrandingLabel: string;
  readonly displayVideosLabel: string;
  readonly displayConfigurationLabel: string;
  readonly branchConfigurationLabel: string;
  readonly branchConfigurationDescription: string;
  readonly allowedTimeLabel: string;
  readonly allowedTimeHelp: string;
  readonly hoursLabel: string;
  readonly minutesLabel: string;
  readonly secondsLabel: string;
  readonly saveConfigurationLabel: string;
  readonly configurationReadOnlyMessage: string;
  readonly concurrencyConflictMessage: string;
  readonly generalBrandLabel: string;
  readonly waitingAreasLabel: string;
  readonly windowsManagementLabel: string;
  readonly terminalsManagementLabel: string;
  readonly displaysManagementLabel: string;
  readonly onlineMonitoringLabel: string;
  readonly savedSuccessfullyLabel: string;
  readonly generalDescription: string;
  readonly mainLabel: string;
  readonly secondaryLabel: string;
  readonly backgroundLabel: string;
  readonly advertisementLabel: string;
  readonly setAdvertiseImagesLabel: string;
  readonly saveGeneralThemeLabel: string;
  readonly serviceRequestDescription: string;
  readonly generalSectionLabel: string;
  readonly screenColorsLabel: string;
  readonly buttonsLabel: string;
  readonly backgroundColorLabel: string;
  readonly headerColorLabel: string;
  readonly footerColorLabel: string;
  readonly mainTextColorLabel: string;
  readonly textColorLabel: string;
  readonly widthLabel: string;
  readonly heightLabel: string;
  readonly spaceLabel: string;
  readonly fontSizeLabel: string;
  readonly saveServiceRequestLabel: string;
  readonly showLanguagePageLabel: string;
  readonly defaultLanguageArabicLabel: string;
  readonly alwaysRequireUserInputLabel: string;
  readonly showServiceNavigationPathLabel: string;
  readonly allowOperatorSelectionLabel: string;
  readonly allowRequestMoreServicesLabel: string;
  readonly languageButtonsLabel: string;
  readonly serviceButtonsLabel: string;
  readonly keypadButtonsLabel: string;
  readonly footerButtonsLabel: string;
  readonly branchEditorDescription: string;
  readonly monitoringDescription: string;
  readonly totalBranchesLabel: string;
  readonly activeBranchesLabel: string;
  readonly maintenanceLabel: string;
  readonly inactiveLabel: string;
  readonly onlineBranchesLabel: string;
  readonly delayedHeartbeatLabel: string;
  readonly offlineBranchesLabel: string;
  readonly ticketsWaitingLabel: string;
  readonly branchesLabel: string;
  readonly branchRecordsHint: string;
  readonly addBranchLabel: string;
  readonly searchLabel: string;
  readonly cityLabel: string;
  readonly statusLabel: string;
  readonly allCitiesLabel: string;
  readonly allStatusesLabel: string;
  readonly codeLabel: string;
  readonly branchLabel: string;
  readonly countersLabel: string;
  readonly servicesLabel: string;
  readonly serviceManagementLabel: string;
  readonly branchServicesLabel: string;
  readonly serviceWorkflowsLabel: string;
  readonly serviceSchedulesLabel: string;
  readonly globalizationRequestsLabel: string;
  readonly centralServiceTreeLabel: string;
  readonly managerLabel: string;
  readonly liveBranchStatusLabel: string;
  readonly monitoringHint: string;
  readonly refreshLabel: string;
  readonly activeTicketsLabel: string;
  readonly servedTodayLabel: string;
  readonly avgWaitLabel: string;
  readonly sortLabel: string;
  readonly newestLabel: string;
  readonly oldestLabel: string;
  readonly pageSizeLabel: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
  readonly totalItemsLabel: string;
  readonly loadingLabel: string;
  readonly apiFallbackLabel: string;
  readonly emptyBranchesLabel: string;
  readonly ipAddressLabel: string;
  readonly arabicNameLabel: string;
  readonly englishNameLabel: string;
  readonly governorateLabel: string;
  readonly updatesAvailableLabel: string;
  readonly lastUpdatedLabel: string;
  readonly createdByLabel: string;
  readonly yesLabel: string;
  readonly noLabel: string;
  readonly close: string;
  readonly closeLabel: string;
}

const TECHNICAL_ADMIN_TRANSLATIONS: Record<AppLanguage, TechnicalAdminTranslations> = {
  ar: {
    closeSidebarLabel:
      '\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062c\u0627\u0646\u0628\u064a\u0629',
    openSidebarLabel:
      '\u0641\u062a\u062d \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062c\u0627\u0646\u0628\u064a\u0629',
    navigationLabel:
      '\u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u062a\u0642\u0646\u064a',
    accountActionsLabel:
      '\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0627\u0644\u062d\u0633\u0627\u0628',
    topbarEyebrow: '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645',
    topbarTitle: '\u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u062a\u0642\u0646\u064a',
    languageButtonLabel: 'English',
    logoutLabel: '\u062a\u0633\u062c\u064a\u0644 \u062e\u0631\u0648\u062c',
    currentUserLabel: 'المستخدم الحالي',
    technicalAdminRoleLabel: 'مسؤول تقني',
    branchAdminRoleLabel: 'مسؤول فرع',
    organizationAdminRoleLabel: 'مسؤول مؤسسة',
    themeConfigurationLabel: 'الهوية البصرية والإعدادات',
    branchEditorLabel: 'محرر الفروع',
    branchBrandingLabel: 'الهوية والإعلانات',
    displayVideosLabel: 'فيديوهات الشاشات',
    displayConfigurationLabel: 'إعدادات شاشة العرض',
    branchConfigurationLabel: 'إعدادات أوقات الفرع',
    branchConfigurationDescription:
      'إعداد المدة المسموح بها لظهور الخدمات في شاشة إصدار التذاكر قبل موعد بدايتها.',
    allowedTimeLabel: 'المدة المسموح بها قبل بداية الخدمة',
    allowedTimeHelp:
      'تحدد هذه المدة الوقت الذي تظهر خلاله الخدمة قبل موعد بدايتها في شاشة إصدار التذاكر.',
    hoursLabel: 'ساعات',
    minutesLabel: 'دقائق',
    secondsLabel: 'ثواني',
    saveConfigurationLabel: 'حفظ الإعدادات',
    configurationReadOnlyMessage:
      'أنت تملك صلاحية العرض فقط. لا يمكنك إدخال تعديلات على هذه الإعدادات.',
    concurrencyConflictMessage:
      'قام مستخدم آخر بتحديث هذه الإعدادات. تم إعادة تحميل أحدث البيانات؛ يُرجى المراجعة والمحاولة مرة أخرى.',
    generalBrandLabel: 'الهوية البصرية العامة',
    generalLabel: '\u0639\u0627\u0645',
    serviceRequestLabel: '\u0637\u0644\u0628 \u0627\u0644\u062e\u062f\u0645\u0629',
    branchManagementLabel: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0641\u0631\u0648\u0639',
    selectedBranchLabel:
      '\u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u0645\u062e\u062a\u0627\u0631',
    branchNavigationLabel: '\u062a\u0646\u0642\u0644 \u0627\u0644\u0641\u0631\u0639',
    openBranchNavigationLabel:
      '\u0641\u062a\u062d \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0641\u0631\u0639',
    closeBranchNavigationLabel:
      '\u0625\u063a\u0644\u0627\u0642 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0641\u0631\u0639',
    backToBranchesLabel:
      '\u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0627\u0644\u0641\u0631\u0648\u0639',
    activeBranchLabel: '\u0646\u0634\u0637',
    inactiveBranchLabel: '\u063a\u064a\u0631 \u0646\u0634\u0637',
    waitingAreasLabel:
      '\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
    windowsManagementLabel: 'أماكن الخدمات',
    terminalsManagementLabel:
      '\u0627\u0644\u062c\u0647\u0627\u0632\u0627\u062a \u0627\u0644\u0637\u0631\u0641\u064a\u0629',
    displaysManagementLabel: '\u0627\u0644\u0634\u0627\u0634\u0627\u062a',
    onlineMonitoringLabel:
      '\u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629',
    savedSuccessfullyLabel:
      '\u062a\u0645 \u0627\u0644\u062d\u0641\u0638 \u0628\u0646\u062c\u0627\u062d',
    generalDescription: 'إدارة ألوان الهوية البصرية وصور الإعلانات.',
    mainLabel: '\u0627\u0644\u0631\u0626\u064a\u0633',
    secondaryLabel: '\u0627\u0644\u062b\u0627\u0646\u0648\u064a',
    backgroundLabel: '\u0627\u0644\u062e\u0644\u0641\u064a\u0629',
    advertisementLabel: '\u0627\u0644\u0625\u0639\u0644\u0627\u0646',
    setAdvertiseImagesLabel:
      '\u062a\u062d\u062f\u064a\u062f \u0635\u0648\u0631 \u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062a',
    saveGeneralThemeLabel: 'حفظ الهوية البصرية العامة',
    serviceRequestDescription:
      '\u0625\u0639\u062f\u0627\u062f \u0633\u0644\u0648\u0643 \u0634\u0627\u0634\u0629 \u0637\u0644\u0628 \u0627\u0644\u062e\u062f\u0645\u0629 \u0648\u0623\u0644\u0648\u0627\u0646\u0647\u0627 \u0648\u0623\u062d\u062c\u0627\u0645 \u0623\u0632\u0631\u0627\u0631\u0647\u0627.',
    generalSectionLabel: '\u0639\u0627\u0645',
    screenColorsLabel: '\u0623\u0644\u0648\u0627\u0646 \u0627\u0644\u0634\u0627\u0634\u0629',
    buttonsLabel: '\u0627\u0644\u0623\u0632\u0631\u0627\u0631',
    backgroundColorLabel: '\u0644\u0648\u0646 \u0627\u0644\u062e\u0644\u0641\u064a\u0629',
    headerColorLabel: '\u0644\u0648\u0646 \u0627\u0644\u0647\u064a\u062f\u0631',
    footerColorLabel: '\u0644\u0648\u0646 \u0627\u0644\u0641\u0648\u062a\u0631',
    mainTextColorLabel:
      '\u0644\u0648\u0646 \u0627\u0644\u0646\u0635 \u0627\u0644\u0631\u0626\u064a\u0633',
    textColorLabel: '\u0644\u0648\u0646 \u0627\u0644\u0646\u0635',
    widthLabel: '\u0627\u0644\u0639\u0631\u0636',
    heightLabel: '\u0627\u0644\u0627\u0631\u062a\u0641\u0627\u0639',
    spaceLabel: '\u0627\u0644\u0645\u0633\u0627\u0641\u0629',
    fontSizeLabel: '\u062d\u062c\u0645 \u0627\u0644\u062e\u0637',
    saveServiceRequestLabel:
      '\u062d\u0641\u0638 \u0637\u0644\u0628 \u0627\u0644\u062e\u062f\u0645\u0629',
    showLanguagePageLabel:
      '\u0625\u0638\u0647\u0627\u0631 \u0635\u0641\u062d\u0629 \u0627\u0644\u0644\u063a\u0629.',
    defaultLanguageArabicLabel:
      '\u0627\u0644\u0644\u063a\u0629 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629 \u0639\u0631\u0628\u064a.',
    alwaysRequireUserInputLabel:
      '\u062f\u0627\u0626\u0645\u0627 \u064a\u062a\u0637\u0644\u0628 \u0625\u062f\u062e\u0627\u0644 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645.',
    showServiceNavigationPathLabel:
      '\u0625\u0638\u0647\u0627\u0631 \u0645\u0633\u0627\u0631 \u0627\u0644\u062e\u062f\u0645\u0629.',
    allowOperatorSelectionLabel:
      '\u0627\u0644\u0633\u0645\u0627\u062d \u0628\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u0634\u063a\u0644.',
    allowRequestMoreServicesLabel:
      '\u0627\u0644\u0633\u0645\u0627\u062d \u0628\u0637\u0644\u0628 \u062e\u062f\u0645\u0627\u062a \u0623\u0643\u062b\u0631.',
    languageButtonsLabel: '\u0623\u0632\u0631\u0627\u0631 \u0627\u0644\u0644\u063a\u0629',
    serviceButtonsLabel:
      '\u0623\u0632\u0631\u0627\u0631 \u0627\u0644\u062e\u062f\u0645\u0627\u062a',
    keypadButtonsLabel:
      '\u0623\u0632\u0631\u0627\u0631 \u0644\u0648\u062d\u0629 \u0627\u0644\u0623\u0631\u0642\u0627\u0645',
    footerButtonsLabel: '\u0623\u0632\u0631\u0627\u0631 \u0627\u0644\u0641\u0648\u062a\u0631',
    branchEditorDescription:
      '\u0625\u062f\u0627\u0631\u0629 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0641\u0631\u0648\u0639 \u0648\u062d\u0627\u0644\u062a\u0647\u0627 \u0648\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u062e\u062f\u0645\u0629.',
    monitoringDescription:
      '\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u062a\u0635\u0627\u0644 \u0627\u0644\u0641\u0631\u0648\u0639 \u0648\u0627\u0644\u062a\u0630\u0627\u0643\u0631 \u0627\u0644\u0646\u0634\u0637\u0629 \u0648\u062a\u0648\u0641\u0631 \u0627\u0644\u062e\u062f\u0645\u0629.',
    totalBranchesLabel: '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0641\u0631\u0648\u0639',
    activeBranchesLabel:
      '\u0627\u0644\u0641\u0631\u0648\u0639 \u0627\u0644\u0646\u0634\u0637\u0629',
    maintenanceLabel: '\u0635\u064a\u0627\u0646\u0629',
    inactiveLabel: '\u063a\u064a\u0631 \u0646\u0634\u0637',
    onlineBranchesLabel: '\u0641\u0631\u0648\u0639 \u0645\u062a\u0635\u0644\u0629',
    delayedHeartbeatLabel: '\u062a\u0623\u062e\u0631 \u0627\u0644\u0627\u062a\u0635\u0627\u0644',
    offlineBranchesLabel:
      '\u0641\u0631\u0648\u0639 \u063a\u064a\u0631 \u0645\u062a\u0635\u0644\u0629',
    ticketsWaitingLabel:
      '\u062a\u0630\u0627\u0643\u0631 \u0641\u064a \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
    branchesLabel: '\u0627\u0644\u0641\u0631\u0648\u0639',
    branchRecordsHint:
      '\u0625\u062f\u0627\u0631\u0629 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0641\u0631\u0648\u0639 \u0648\u062a\u062d\u062f\u064a\u062b\u0647\u0627 \u0645\u0646 \u062e\u062f\u0645\u0629 \u0627\u0644\u0641\u0631\u0648\u0639.',
    addBranchLabel: '\u0625\u0636\u0627\u0641\u0629 \u0641\u0631\u0639',
    searchLabel: '\u0628\u062d\u062b',
    cityLabel: '\u0627\u0644\u0645\u062f\u064a\u0646\u0629',
    statusLabel: '\u0627\u0644\u062d\u0627\u0644\u0629',
    allCitiesLabel: '\u0643\u0644 \u0627\u0644\u0645\u062f\u0646',
    allStatusesLabel: '\u0643\u0644 \u0627\u0644\u062d\u0627\u0644\u0627\u062a',
    codeLabel: '\u0627\u0644\u0643\u0648\u062f',
    branchLabel: '\u0627\u0644\u0641\u0631\u0639',
    countersLabel: '\u0627\u0644\u0634\u0628\u0627\u0628\u064a\u0643',
    servicesLabel: '\u0627\u0644\u062e\u062f\u0645\u0627\u062a',
    serviceManagementLabel:
      '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062e\u062f\u0645\u0627\u062a',
    branchServicesLabel: '\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0641\u0631\u0639',
    serviceWorkflowsLabel:
      '\u0645\u0633\u0627\u0631\u0627\u062a \u0627\u0644\u062e\u062f\u0645\u0627\u062a',
    serviceSchedulesLabel:
      '\u062c\u062f\u0627\u0648\u0644 \u0627\u0644\u062e\u062f\u0645\u0627\u062a',
    globalizationRequestsLabel:
      '\u0637\u0644\u0628\u0627\u062a \u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u062e\u062f\u0645\u0627\u062a',
    centralServiceTreeLabel:
      '\u0634\u062c\u0631\u0629 \u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0645\u0631\u0643\u0632\u064a\u0629',
    managerLabel: '\u0627\u0644\u0645\u062f\u064a\u0631',
    liveBranchStatusLabel:
      '\u062d\u0627\u0644\u0629 \u0627\u0644\u0641\u0631\u0648\u0639 \u0627\u0644\u062d\u064a\u0629',
    monitoringHint:
      '\u0644\u0642\u0637\u0629 \u062a\u062c\u0631\u064a\u0628\u064a\u0629 \u0644\u0627\u062a\u0635\u0627\u0644 \u0627\u0644\u0641\u0631\u0648\u0639 \u0648\u0646\u0634\u0627\u0637 \u0627\u0644\u0637\u0648\u0627\u0628\u064a\u0631. ',
    refreshLabel: '\u062a\u062d\u062f\u064a\u062b',
    activeTicketsLabel: '\u062a\u0630\u0627\u0643\u0631 \u0646\u0634\u0637\u0629',
    servedTodayLabel:
      '\u062a\u0645\u062a \u062e\u062f\u0645\u062a\u0647\u0627 \u0627\u0644\u064a\u0648\u0645',
    avgWaitLabel: '\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
    sortLabel: '\u0627\u0644\u062a\u0631\u062a\u064a\u0628',
    newestLabel: '\u0627\u0644\u0623\u062d\u062f\u062b',
    oldestLabel: '\u0627\u0644\u0623\u0642\u062f\u0645',
    pageSizeLabel: '\u062d\u062c\u0645 \u0627\u0644\u0635\u0641\u062d\u0629',
    previousLabel: '\u0627\u0644\u0633\u0627\u0628\u0642',
    nextLabel: '\u0627\u0644\u062a\u0627\u0644\u064a',
    totalItemsLabel:
      '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0639\u0646\u0627\u0635\u0631',
    loadingLabel: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...',
    apiFallbackLabel:
      '\u062a\u0639\u0630\u0631 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u062e\u062f\u0645\u0629 \u0627\u0644\u0641\u0631\u0648\u0639.',
    emptyBranchesLabel:
      '\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u0631\u0648\u0639 \u0645\u0637\u0627\u0628\u0642\u0629.',
    ipAddressLabel: 'IP Address',
    arabicNameLabel: '\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0639\u0631\u0628\u064a',
    englishNameLabel:
      '\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a',
    governorateLabel: '\u0627\u0644\u0645\u062d\u0627\u0641\u0638\u0629',
    updatesAvailableLabel:
      '\u062a\u062d\u062f\u064a\u062b\u0627\u062a \u0645\u062a\u0627\u062d\u0629',
    lastUpdatedLabel: '\u0622\u062e\u0631 \u062a\u062d\u062f\u064a\u062b',
    createdByLabel: '\u0623\u0646\u0634\u0626 \u0628\u0648\u0627\u0633\u0637\u0629',
    yesLabel: '\u0646\u0639\u0645',
    noLabel: '\u0644\u0627',
    close: '\u0625\u063a\u0644\u0627\u0642',
    closeLabel: '\u0625\u063a\u0644\u0627\u0642',
  },
  en: {
    closeSidebarLabel: 'Close sidebar',
    openSidebarLabel: 'Open sidebar',
    navigationLabel: 'Technical Admin Pages',
    accountActionsLabel: 'Account actions',
    topbarEyebrow: 'Operations Dashboard',
    topbarTitle: 'Technical Admin',
    languageButtonLabel: 'Arabic',
    logoutLabel: 'Logout',
    currentUserLabel: 'Current user',
    technicalAdminRoleLabel: 'Technical Admin',
    branchAdminRoleLabel: 'Branch Admin',
    organizationAdminRoleLabel: 'Organization Admin',
    themeConfigurationLabel: 'Visual Identity & Configuration',
    generalLabel: 'General',
    serviceRequestLabel: 'Service Request',
    branchManagementLabel: 'Branch Management',
    selectedBranchLabel: 'Selected branch',
    branchNavigationLabel: 'Branch navigation',
    openBranchNavigationLabel: 'Open branch navigation',
    closeBranchNavigationLabel: 'Close branch navigation',
    backToBranchesLabel: 'Back to branches',
    activeBranchLabel: 'Active',
    inactiveBranchLabel: 'Inactive',
    branchEditorLabel: 'Branch Editor',
    branchBrandingLabel: 'Branding & Advertisements',
    displayVideosLabel: 'Display Videos',
    displayConfigurationLabel: 'Display Configuration',
    branchConfigurationLabel: 'Branch Configuration',
    branchConfigurationDescription:
      'Configure how early services appear on the ticket issuance screen before their scheduled start time.',
    allowedTimeLabel: 'Allowed Time Before Service Start',
    allowedTimeHelp:
      'Defines how early a service appears on the ticket issuance screen before its scheduled start time.',
    hoursLabel: 'Hours',
    minutesLabel: 'Minutes',
    secondsLabel: 'Seconds',
    saveConfigurationLabel: 'Save Configuration',
    configurationReadOnlyMessage:
      'You have view-only access. Modification of these configuration settings is disabled.',
    concurrencyConflictMessage:
      'Another user modified this configuration. The latest data has been reloaded; please review and try saving again.',
    generalBrandLabel: 'General Brand',
    waitingAreasLabel: 'Waiting Areas',
    windowsManagementLabel: 'Service Locations',
    terminalsManagementLabel: 'Terminals',
    displaysManagementLabel: 'Displays',
    onlineMonitoringLabel: 'Online Monitoring',
    savedSuccessfullyLabel: 'Saved successfully',
    generalDescription: 'Manage visual identity colors and advertisement assets.',
    mainLabel: 'Main',
    secondaryLabel: 'Secondary',
    backgroundLabel: 'Background',
    advertisementLabel: 'Advertisement',
    setAdvertiseImagesLabel: 'Set Advertise Images',
    saveGeneralThemeLabel: 'Save General Visual Identity',
    serviceRequestDescription:
      'Reconfigure kiosk service request flow, language settings, and service button layout.',
    generalSectionLabel: 'General',
    screenColorsLabel: 'Screen Colors',
    buttonsLabel: 'Buttons',
    backgroundColorLabel: 'Background color',
    headerColorLabel: 'Header color',
    footerColorLabel: 'Footer color',
    mainTextColorLabel: 'Main text color',
    textColorLabel: 'Text color',
    widthLabel: 'Width',
    heightLabel: 'Height',
    spaceLabel: 'Spacing',
    fontSizeLabel: 'Font size',
    saveServiceRequestLabel: 'Save Service Request',
    showLanguagePageLabel: 'Show language page',
    defaultLanguageArabicLabel: 'Default language is Arabic',
    alwaysRequireUserInputLabel: 'Always require user input',
    showServiceNavigationPathLabel: 'Show service navigation path',
    allowOperatorSelectionLabel: 'Allow operator selection',
    allowRequestMoreServicesLabel: 'Allow request more services',
    languageButtonsLabel: 'Language Buttons',
    serviceButtonsLabel: 'Service Buttons',
    keypadButtonsLabel: 'Keypad Buttons',
    footerButtonsLabel: 'Footer Buttons',
    branchEditorDescription:
      'Manage branch data, update branch status, and configure service assignments.',
    monitoringDescription:
      'Monitor branch connectivity and live ticket activity, and provide service delivery insights.',
    totalBranchesLabel: 'Total branches',
    activeBranchesLabel: 'Active branches',
    maintenanceLabel: 'Maintenance',
    inactiveLabel: 'Inactive',
    onlineBranchesLabel: 'Online branches',
    delayedHeartbeatLabel: 'Delayed heartbeat',
    offlineBranchesLabel: 'Offline branches',
    ticketsWaitingLabel: 'Tickets waiting',
    branchesLabel: 'Branches',
    branchRecordsHint: 'Manage branch records and update branch settings from one place.',
    addBranchLabel: 'Add Branch',
    searchLabel: 'Search',
    cityLabel: 'City',
    statusLabel: 'Status',
    allCitiesLabel: 'All Cities',
    allStatusesLabel: 'All statuses',
    codeLabel: 'Code',
    branchLabel: 'Branch',
    countersLabel: 'Counters',
    servicesLabel: 'Services',
    serviceManagementLabel: 'Service Management',
    branchServicesLabel: 'Branch Services',
    serviceWorkflowsLabel: 'Service Workflows',
    serviceSchedulesLabel: 'Service Schedules',
    globalizationRequestsLabel: 'Globalization Requests',
    centralServiceTreeLabel: 'Central Service Tree',
    managerLabel: 'Manager',
    liveBranchStatusLabel: 'Live branch status',
    monitoringHint:
      'Real-time connection and service activity tracker to keep branch health and performance visible.',
    refreshLabel: 'Refresh',
    activeTicketsLabel: 'Active Tickets',
    servedTodayLabel: 'Served Today',
    avgWaitLabel: 'Average Wait',
    sortLabel: 'Sort',
    newestLabel: 'Newest',
    oldestLabel: 'Oldest',
    pageSizeLabel: 'Page size',
    previousLabel: 'Previous',
    nextLabel: 'Next',
    totalItemsLabel: 'Total items',
    loadingLabel: 'Loading...',
    apiFallbackLabel: 'Unable to load branch service at the moment.',
    emptyBranchesLabel: 'No matching branches found.',
    ipAddressLabel: 'IP Address',
    arabicNameLabel: 'Arabic Name',
    englishNameLabel: 'English Name',
    governorateLabel: 'Governorate',
    updatesAvailableLabel: 'Available updates',
    lastUpdatedLabel: 'Last updated',
    createdByLabel: 'Created by',
    yesLabel: 'Yes',
    noLabel: 'No',
    close: 'Close',
    closeLabel: 'Close',
  },
};

@Injectable({ providedIn: 'root' })
export class TechnicalAdminI18nStore {
  private readonly appLanguageStore = inject(AppLanguageStore);

  readonly language = this.appLanguageStore.language;
  readonly direction = this.appLanguageStore.direction;
  readonly translations = computed(
    () => TECHNICAL_ADMIN_TRANSLATIONS[this.appLanguageStore.language()],
  );

  toggleLanguage(): void {
    this.appLanguageStore.toggleLanguage();
  }
}
