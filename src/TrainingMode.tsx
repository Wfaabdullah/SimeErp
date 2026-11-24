import { useMemo } from 'react';
import { Check, Circle, Clock3, GraduationCap, RotateCcw } from 'lucide-react';
import type { CompanyData } from './domain/model';
import { evaluateScenario, recordScenarioResult, setTrainingAnswer, startTrainingScenario, trainingScenarios } from './domain/training';

interface Props {
  c: CompanyData;
  go: (path: string) => void;
  update: (fn: (company: CompanyData) => CompanyData) => void;
  safe: (fn: () => void) => void;
}

export default function TrainingMode({ c, go, update, safe }: Props) {
  const results = useMemo(() => Object.fromEntries(trainingScenarios.map(s => [s.id, evaluateScenario(s.id, c)])), [c]);

  return <>
    <div className="section-title">
      <div><h2>Training Mode</h2><p>Complete guided exercises with your real company records and ERP workflows.</p></div>
    </div>
    <div className="notice"><GraduationCap size={16}/><span>Start an exercise to capture a baseline. Only records you create after that point count; demo records never count as student work. All modules remain open for free exploration.</span></div>
    <div className="scenario-grid training-scenarios">
      {trainingScenarios.map(scenario => {
        const result = results[scenario.id];
        const hasBaseline = Boolean(c.training.baselines?.[scenario.id]?.companyId === c.company.id);
        const wasCompleted = c.training.completed.includes(scenario.id);
        const best = c.training.bestScores?.[scenario.id] ?? 0;
        return <article className="panel scenario training-scenario" key={scenario.id}>
          <div className="scenario-top">
            <span className="scenario-icon"><GraduationCap size={18}/></span>
            <span className={result.completed || wasCompleted ? 'complete-tag' : 'pending-tag'}>{result.completed || wasCompleted ? 'Completed' : hasBaseline ? `${result.passed}/${result.total} steps` : 'Not started'}</span>
          </div>
          <div className="training-meta"><span>{scenario.module}</span><span>{scenario.difficulty}</span><span><Clock3 size={12}/>{scenario.minutes} min</span></div>
          <h3>{scenario.title}</h3>
          <p>{scenario.scenario}</p>
          <div className="learning-goals"><b>Learning goals</b><span>{scenario.learningGoals.join(' · ')}</span></div>
          <details className="training-instructions">
            <summary>Instructions & ERP concept</summary>
            <ol>{scenario.instructions.map((text, i) => <li key={i}>{text}</li>)}</ol>
            <p>{scenario.explanation}</p>
          </details>
          <div className="training-step-list">
            {scenario.steps.map((step, i) => {
              const status = result.steps[i];
              const answerValue = c.training.answers?.[scenario.id]?.[step.id] ?? '';
              return <div className={`training-step ${status.ok ? 'is-passed' : ''}`} key={step.id}>
                <div className="training-step-title">
                  {status.ok ? <Check size={15}/> : <Circle size={14}/>}<span>{status.text}</span>
                </div>
                {step.kind === 'answer' && hasBaseline && <label className="training-answer">
                  {step.answerLabel}
                  <input
                    type={step.inputType ?? 'text'}
                    step={step.inputType === 'number' ? '0.01' : undefined}
                    value={answerValue}
                    placeholder={step.placeholder}
                    onChange={event => update(company => setTrainingAnswer(company, scenario.id, step.id, event.target.value))}
                  />
                </label>}
                {!status.ok && hasBaseline && status.hint && <p className="training-feedback">{status.hint}</p>}
                {!status.ok && status.mistake && <p className="training-mistake">{status.mistake}</p>}
              </div>;
            })}
          </div>
          {result.completed && <div className="training-success"><Check size={15}/> Scenario complete. {scenario.explanation}</div>}
          <div className="scenario-actions training-actions">
            <button className="btn secondary" onClick={() => go(scenario.route)}>Open {scenario.module}</button>
            <button className="btn secondary" onClick={() => safe(() => update(company => startTrainingScenario(company, scenario.id)))}>
              {hasBaseline ? <RotateCcw size={14}/> : <GraduationCap size={14}/>} {hasBaseline ? 'Restart' : 'Start exercise'}
            </button>
            <button className="btn primary" disabled={!hasBaseline} onClick={() => safe(() => update(company => recordScenarioResult(company, evaluateScenario(scenario.id, company))))}>
              Check my work{best > 0 ? ` · Best ${best}%` : ''}
            </button>
          </div>
          {!hasBaseline && <p className="small-note training-baseline-note"><Circle size={12}/> Start first; existing demo records are excluded from evaluation.</p>}
        </article>;
      })}
    </div>
  </>;
}
