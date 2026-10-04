'use client';

import { useReducer, useCallback } from 'react';

export type ValidatorFn<T = string> = (value: T) => boolean | string;

interface InputState<T> {
  value: T;
  isTouched: boolean;
}

type InputAction<T> =
  | { type: 'INPUT'; value: T }
  | { type: 'BLUR' }
  | { type: 'RESET'; initialValue: T };

function createInputReducer<T>() {
  return (state: InputState<T>, action: InputAction<T>): InputState<T> => {
    switch (action.type) {
      case 'INPUT':
        return { value: action.value, isTouched: state.isTouched };
      case 'BLUR':
        return { value: state.value, isTouched: true };
      case 'RESET':
        return { value: action.initialValue, isTouched: false };
      default:
        return state;
    }
  };
}

export interface UseInputOptions<T> {
  initialValue?: T;
  validators?: ValidatorFn<T>[];
}

export function useInput<T = string>(
  validateOrOptions?: ValidatorFn<T> | UseInputOptions<T>,
  legacyInitialValue: T = '' as unknown as T
) {
  let validators: ValidatorFn<T>[] = [];
  let initialValue: T = legacyInitialValue;

  if (typeof validateOrOptions === 'function') {
    validators = [validateOrOptions];
  } else if (validateOrOptions && typeof validateOrOptions === 'object') {
    if (validateOrOptions.validators) {
      validators = validateOrOptions.validators;
    }
    if (validateOrOptions.initialValue !== undefined) {
      initialValue = validateOrOptions.initialValue;
    }
  }

  const [state, dispatch] = useReducer(
    createInputReducer<T>(),
    { value: initialValue, isTouched: false }
  );

  let errorMessage: string | null = null;
  let valueIsValid = true;

  for (const validator of validators) {
    const result = validator(state.value);
    if (typeof result === 'string') {
      valueIsValid = false;
      errorMessage = result;
      break;
    } else if (result === false) {
      valueIsValid = false;
      errorMessage = 'Invalid field value';
      break;
    }
  }

  const hasError = !valueIsValid && state.isTouched;

  const valueChangeHandler = useCallback((eventOrValue: any) => {
    const newValue =
      eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue
        ? eventOrValue.target.value
        : eventOrValue;
    dispatch({ type: 'INPUT', value: newValue });
  }, []);

  const inputBlurHandler = useCallback(() => {
    dispatch({ type: 'BLUR' });
  }, []);

  const reset = useCallback((newVal: T = initialValue) => {
    dispatch({ type: 'RESET', initialValue: newVal });
  }, [initialValue]);

  const setValue = useCallback((val: T) => {
    dispatch({ type: 'INPUT', value: val });
  }, []);

  return {
    value: state.value,
    isTouched: state.isTouched,
    valueIsValid,
    hasError,
    errorMessage: hasError ? errorMessage : null,
    valueChangeHandler,
    inputBlurHandler,
    setValue,
    reset,
  };
}
