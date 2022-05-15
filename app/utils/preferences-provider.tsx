import { createContext, ReactNode, useState, useContext } from "react";

type UserPreferences = {
  studyTime: number;
  breakTime: number;
};

type PrefContext = {
  preferences: UserPreferences;
  updatePreferences: (val: UserPreferences) => void;
};

const getPreferences = (): UserPreferences => {
  const item = typeof window !== "undefined" && localStorage.getItem("preferences");
  return item ? (JSON.parse(item) as UserPreferences) : { studyTime: 21, breakTime: 10 };
};

const preferencesCtx = createContext<PrefContext | undefined>(undefined);
export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    studyTime: getPreferences().studyTime,
    breakTime: getPreferences().breakTime
  });

  const updatePreferences = (updatedPreferences: UserPreferences) => {
    typeof window !== "undefined" && localStorage.setItem("preferences", JSON.stringify(updatedPreferences));
    setPreferences(updatedPreferences);
  };

  return (
    <preferencesCtx.Provider
      value={{
        preferences,
        updatePreferences
      }}
    >
      {children}
    </preferencesCtx.Provider>
  );
};

export const usePreferences = () => {
  const ctx = useContext(preferencesCtx);
  if (typeof window !== "undefined" && ctx === undefined) throw Error("Context should be used inside a provider");
  return ctx as PrefContext;
};
