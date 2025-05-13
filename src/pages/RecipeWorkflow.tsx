import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getRecipeChannel } from '@/lib/recipeChannel';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const RecipeWorkflow = ({ recipeId }) => {
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);
  const [mode, setMode] = useState<'delay' | 'action' | 'done'>('delay');

  const channelRef = useRef(null);

  // Fetch steps
  useEffect(() => {
    const fetchSteps = async () => {
      const { data, error } = await supabase
        .from('recipe_steps')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('step_number');

      if (!error) setSteps(data);
    };

    fetchSteps();
  }, [recipeId]);

  // Setup channel
  useEffect(() => {
    const channel = getRecipeChannel(recipeId);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'state' }, (payload) => {
        const { step, mode: m, timer: t } = payload.payload;
        setCurrentStepIndex(step);
        setMode(m);
        setTimer(t);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recipeId]);

  // Timer logic with broadcast
  useEffect(() => {
    if (!steps.length || mode === 'done') return;

    const step = steps[currentStepIndex];
    const duration = mode === 'delay' ? step.delay_sec : step.duration_sec;

    if (duration <= 0) {
      setMode(mode === 'delay' ? 'action' : 'done');
      return;
    }

    setTimer(duration);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          const newMode = mode === 'delay' ? 'action' : 'done';
          setMode(newMode);
          channelRef.current?.send({
            type: 'broadcast',
            event: 'state',
            payload: {
              step: currentStepIndex,
              mode: newMode,
              timer: 0,
            },
          });
          return null;
        }

        const newVal = prev! - 1;
        // Broadcast current timer state
        channelRef.current?.send({
          type: 'broadcast',
          event: 'state',
          payload: {
            step: currentStepIndex,
            mode,
            timer: newVal,
          },
        });
        return newVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [steps, currentStepIndex, mode]);

  const markStepDone = async () => {
    const step = steps[currentStepIndex];
    await supabase
      .from('recipe_steps')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', step.id);

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStepIndex(nextIndex);
      setMode('delay');

      channelRef.current?.send({
        type: 'broadcast',
        event: 'state',
        payload: {
          step: nextIndex,
          mode: 'delay',
          timer: steps[nextIndex].delay_sec,
        },
      });
    } else {
      setMode('done');
      channelRef.current?.send({
        type: 'broadcast',
        event: 'state',
        payload: {
          step: currentStepIndex,
          mode: 'done',
          timer: 0,
        },
      });
    }
  };

  if (!steps.length) return <p>Loading...</p>;

  const current = steps[currentStepIndex];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Step {current.step_number}: {current.instruction}</h2>
      <p className="text-muted-foreground">Mode: {mode.toUpperCase()}</p>
      {timer !== null && <p className="text-2xl">{timer}s</p>}
      {mode === 'done' && (
        <Button onClick={markStepDone}>Mark Step Complete</Button>
      )}
    </div>
  );
};

export default RecipeWorkflow;
