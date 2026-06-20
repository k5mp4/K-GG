import { createContext, useContext } from 'react';

type InteractionSettings = {
  hoverInteractionsEnabled: boolean;
};

const InteractionSettingsContext = createContext<InteractionSettings>({
  hoverInteractionsEnabled: true,
});

export const InteractionSettingsProvider = InteractionSettingsContext.Provider;

export function useInteractionSettings() {
  return useContext(InteractionSettingsContext);
}
