export function defaultSettings() {
  return {
    trading: {
      defaultOrderType: "Market",
      defaultLeverage: "3x",
      defaultSizePercent: 5,
      confirmBeforeOpen: true,
      confirmBeforeClose: true,
      confirmBeforeModifySLTP: false,
      slippageTolerance: "0.5%",
    },
    risk: {
      maxDailyLossPercent: 5,
      maxDrawdownPercent: 15,
      maxPositionSizePercent: 25,
      maxOpenPositions: 5,
      maxLeverage: 10,
      killSwitch: false,
    },
    display: {
      defaultChartTimeframe: "1H",
      numberFormat: "comma",
      timezone: "UTC+7",
      priceFlashAnimations: true,
    },
    notifications: {
      alertTypes: {
        priceTarget: true,
        signalDetection: true,
        tradeExecution: true,
        riskLimitWarnings: true,
        stopLossTriggered: true,
        takeProfitHit: true,
      },
      deliveryMethods: {
        inApp: true,
        browserPush: false,
        emailDigest: false,
        telegram: false,
      },
      soundEffects: true,
    },
  };
}
