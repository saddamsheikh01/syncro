"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ExpatFunnelLayout from "./ExpatFunnelLayout";
import Step1UserPhase from "./steps/Step1UserPhase";
import Step2CitySelection from "./steps/Step2CitySelection";
import Step3Timeline from "./steps/Step3Timeline";
import Step4PersonalizeStrategy from "./steps/Step4PersonalizeStrategy";
import Step5Household from "./steps/Step5Household";
import Step6MainGoal from "./steps/Step6MainGoal";
import Step7WorkStatus from "./steps/Step7WorkStatus";
import Step8Budget from "./steps/Step8Budget";
import Step9Priority from "./steps/Step9Priority";
import Step10CityValues from "./steps/Step10CityValues";
import { useExpats } from "../../../hooks/expats/useExpats";
import type { FunnelAnswers } from "../../../types/expats";

interface Props {
  step: number;
}

const TOTAL_STEPS = 10;

export default function ExpatFunnel({ step }: Props) {
  const router = useRouter();
  const { initSession, saveAnswer, setLocalAnswer, funnelAnswers, isLoading, session } = useExpats();
  const initialized = useRef(false);

  const [localChanges, setLocalChanges] = useState<Partial<FunnelAnswers>>({});

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initSession().catch(() => null);
    }
  }, [initSession]);

  const mergedAnswers: FunnelAnswers = { ...funnelAnswers, ...localChanges };

  const canContinue = (): boolean => {
    switch (step) {
      case 1: return !!mergedAnswers.userPhase;
      case 2: return !!(mergedAnswers.currentCityName || mergedAnswers.targetType);
      case 3: return !!mergedAnswers.relocationTime;
      case 4: return !!mergedAnswers.ageRange;
      case 5: return !!mergedAnswers.household;
      case 6: return !!mergedAnswers.primaryGoal;
      case 7: return !!mergedAnswers.workStatus;
      case 8: return !!(mergedAnswers.monthlyBudget);
      case 9: return !!mergedAnswers.priorityProblem;
      case 10: return !!mergedAnswers.socialPriority;
      default: return true;
    }
  };

  const getStepGroup = (s: number): "CITY_FIT" | "POSITIONING" | "EXECUTION" => {
    if (s <= 3) return "CITY_FIT";
    if (s <= 7) return "POSITIONING";
    return "EXECUTION";
  };

  const getQuestionKey = (s: number, answers: FunnelAnswers): string => {
    switch (s) {
      case 1: return "user_phase";
      case 2: return "city_selection";
      case 3: return answers.userPhase === "already_there" ? "time_living_there" : "relocation_time";
      case 4: return "age_range";
      case 5: return "relationship";
      case 6: return "motivation";
      case 7: return "work_type";
      case 8: return "budget";
      case 9: return "need";
      case 10: return "city_priority";
      default: return `step_${s}`;
    }
  };

  const getAnswerValue = (s: number, answers: FunnelAnswers): unknown => {
    switch (s) {
      case 1: return answers.userPhase;
      case 2: return {
        currentCityName: answers.currentCityName,
        targetCityName: answers.targetCityName,
        targetType: answers.targetType,
      };
      case 3: return answers.relocationTime;
      case 4: return { ageRange: answers.ageRange, gender: answers.gender };
      case 5: return {
        household: answers.household,
        hasPets: answers.hasPets,
        childrenCount: answers.childrenCount,
        childrenAgeRange: answers.childrenAgeRange,
      };
      case 6: return answers.primaryGoal;
      case 7: return {
        workStatus: answers.workStatus,
        workStructure: answers.workStructure,
        isRemote: answers.isRemote,
      };
      case 8: return {
        monthlyBudget: answers.monthlyBudget,
        desiredLifestyle: answers.desiredLifestyle,
      };
      case 9: return answers.priorityProblem;
      case 10: return answers.socialPriority;
      default: return null;
    }
  };

  const handleContinue = async () => {
    if (!session) return;

    const combined = mergedAnswers;
    setLocalAnswer(localChanges);

    const qKey = getQuestionKey(step, combined);
    const qGroup = getStepGroup(step);
    const val = getAnswerValue(step, combined);

    try {
      await saveAnswer(step, qGroup, qKey, val, localChanges);
    } catch {
      // Non-blocking — still advance
    }

    setLocalChanges({});

    if (step < TOTAL_STEPS) {
      router.push(`/expats/funnel/${step + 1}`);
    } else {
      router.push("/expats/wow");
    }
  };

  const updateLocal = (updates: Partial<FunnelAnswers>) => {
    setLocalChanges((prev) => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1UserPhase
            defaultValue={mergedAnswers.userPhase}
            onChange={(val) => updateLocal({ userPhase: val as FunnelAnswers["userPhase"] })}
          />
        );
      case 2:
        return (
          <Step2CitySelection
            defaultCurrentCity={mergedAnswers.currentCityName}
            defaultTargetCity={mergedAnswers.targetCityName}
            defaultTargetType={mergedAnswers.targetType}
            onChange={(data) => updateLocal(data)}
          />
        );
      case 3:
        return (
          <Step3Timeline
            userPhase={mergedAnswers.userPhase}
            defaultValue={mergedAnswers.relocationTime}
            onChange={(val) => updateLocal({ relocationTime: val })}
          />
        );
      case 4:
        return (
          <Step4PersonalizeStrategy
            defaultAgeRange={mergedAnswers.ageRange}
            defaultGender={mergedAnswers.gender}
            onChange={(data) => updateLocal(data)}
          />
        );
      case 5:
        return (
          <Step5Household
            defaultHousehold={mergedAnswers.household}
            defaultHasPets={mergedAnswers.hasPets}
            defaultChildrenCount={mergedAnswers.childrenCount}
            defaultChildrenAgeRange={mergedAnswers.childrenAgeRange}
            onChange={(data) => updateLocal(data)}
          />
        );
      case 6:
        return (
          <Step6MainGoal
            defaultValue={mergedAnswers.primaryGoal}
            onChange={(val) => updateLocal({ primaryGoal: val })}
          />
        );
      case 7:
        return (
          <Step7WorkStatus
            defaultWorkStatus={mergedAnswers.workStatus}
            defaultWorkStructure={mergedAnswers.workStructure}
            defaultIsRemote={mergedAnswers.isRemote}
            onChange={(data) => updateLocal(data)}
          />
        );
      case 8:
        return (
          <Step8Budget
            defaultBudget={mergedAnswers.monthlyBudget}
            defaultLifestyle={mergedAnswers.desiredLifestyle}
            onChange={(data) => updateLocal(data)}
          />
        );
      case 9:
        return (
          <Step9Priority
            defaultValue={mergedAnswers.priorityProblem}
            onChange={(val) => updateLocal({ priorityProblem: val })}
          />
        );
      case 10:
        return (
          <Step10CityValues
            defaultValue={mergedAnswers.socialPriority}
            onChange={(val) => updateLocal({ socialPriority: val })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ExpatFunnelLayout
      step={step}
      totalSteps={TOTAL_STEPS}
      onContinue={handleContinue}
      continueDisabled={!canContinue()}
      isLoading={isLoading}
      continueLabel={step === TOTAL_STEPS ? "Generate My Strategy" : "Continue"}
    >
      {renderStep()}
    </ExpatFunnelLayout>
  );
}
