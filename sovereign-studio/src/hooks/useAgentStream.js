import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../services/api';

export function useAgentStream(query, options = {}) {
  const [logs, setLogs] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const abortRef = useRef(false);

  const run = useCallback(
    (optionalQuery, optionalOptions) => {
      const activeQuery = optionalQuery ?? query;
      const activeOptions = optionalOptions ?? options;

      abortRef.current = false;
      setLogs([]);
      setCurrentStep(1);
      setFinalResult(null);
      setIsRunning(true);

      const onEvent = (nodeName, data) => {
        if (nodeName === 'error') {
          setLogs((prev) => [...prev, `ERROR: ${data.detail || 'unknown error'}`]);
          return;
        }
        if (nodeName === 'final') {
          setFinalResult(data);
          setIsRunning(false);
          return;
        }
        const entry = buildLogLine(nodeName, data);
        if (entry) setLogs((prev) => [...prev, entry]);
        setCurrentStep((prev) => prev + 1);
      };

      const onError = (error) => {
        setLogs((prev) => [...prev, `ERROR: ${error.message}`]);
        setIsRunning(false);
      };

      apiService.streamAgentQuery(activeQuery, activeOptions, onEvent, onError);
    },
    [query, options]
  );

  const stop = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { logs, currentStep, isRunning, finalResult, run, stop };
}

function buildLogLine(nodeName, data) {
  switch (nodeName) {
    case 'route':
      return `[ROUTE] classified as "${data.task_type}" → model ${data.model_tag}`;
    case 'plan':
      return `[PLAN] ${Array.isArray(data.subtasks) ? `${data.subtasks.length} subtask(s)` : 'direct response'}`;
    case 'execute': {
      const results = data.results || [];
      return results.length ? `[EXECUTE] completed tool "${results[results.length - 1].tool}"` : '[EXECUTE] running tool...';
    }
    case 'evaluate': {
      const scores = data.confidence_scores || [];
      return scores.length ? `[EVALUATE] confidence ${scores[scores.length - 1].toFixed(2)}` : null;
    }
    case 'synthesize':
      return '[SYNTHESIZE] drafting final response...';
    case 'deliver':
      return `[DELIVER] ${data.deliverables && data.deliverables.length ? `${data.deliverables.length} file(s) generated` : 'no files generated'}`;
    default:
      return null;
  }
}