import { Tabs, TabList, Tab, TabPanels, TabPanel, useTabsContext } from "@reach/tabs";
import { ReactNode } from "react";
import { TimerState } from "~/routes";
import { setStateType } from "~/types";
import { mergeClassNames } from "~/utils/client";
import Timer from "./Timer";

//TODO: move to persisted storage
const USER_PREF = {
  workTime: 25,
  breakTime: 10
};

type TimerTabsProps = {
  selectedTabIdx: number;
  timerState: TimerState;
  setTimerState: setStateType<TimerState>;
  setTimerCaptured: setStateType<{ start: number; stop: number }>;
  handleTabsChange: (selectedIdx: number) => void;
};

export default function TimerTabs({
  selectedTabIdx,
  timerState,
  setTimerCaptured,
  setTimerState,
  handleTabsChange
}: TimerTabsProps) {
  return (
    <Tabs index={selectedTabIdx} onChange={handleTabsChange}>
      <TabList className='mx-auto flex w-full justify-center gap-4 rounded-md bg-[#272851] p-1 '>
        <CustomTab index={0}>Study</CustomTab>
        <CustomTab index={1}>Break</CustomTab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <Timer
            key={`${selectedTabIdx}0`}
            setTimerState={setTimerState}
            timerState={timerState}
            initialTime={USER_PREF.workTime}
            setTimerCaptured={setTimerCaptured}
          />
        </TabPanel>
        <TabPanel>
          <Timer
            key={`${selectedTabIdx}1`}
            setTimerState={setTimerState}
            timerState={timerState}
            initialTime={USER_PREF.breakTime}
            setTimerCaptured={setTimerCaptured}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

function CustomTab({ index, children }: { index: number; children: ReactNode }) {
  const { selectedIndex } = useTabsContext();
  const isActiveTab = selectedIndex === index;
  return (
    <Tab
      className={mergeClassNames("w-full rounded-md px-3 font-semibold text-white", isActiveTab ? "bg-[#43446A]" : "")}
    >
      {children}
    </Tab>
  );
}
