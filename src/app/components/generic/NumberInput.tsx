import React, { useEffect, useState } from 'react';

interface NumberInputProps extends Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'onChange'> {
  onChange?: (v: number) => void;
  value: number;
  commitOnBlur?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = (props) => {
  const {
    value,
    onChange,
    commitOnBlur = false,
    onBlur,
    ...inputProps
  } = props;
  const [inputValue, setInputValue] = useState<string>(value.toString() || '');

  useEffect(() => {
    // If a new value is passed in as a prop, update the state of this component
    setInputValue(value.toString() || '');
  }, [value]);

  const commitValue = (target: HTMLInputElement) => {
    if (target.validity.valid && onChange && target.value !== '') {
      onChange(target.valueAsNumber);
    }
  };

  return (
    <input
      type="number"
      className="form-control w-16"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...inputProps}
      value={inputValue}
      onChange={(evt) => {
        // Always update the value of this component locally
        setInputValue(evt.currentTarget.value);

        if (!commitOnBlur) {
          commitValue(evt.currentTarget);
        }
      }}
      onBlur={(evt) => {
        if (commitOnBlur) {
          if (evt.currentTarget.validity.valid && evt.currentTarget.value !== '') {
            commitValue(evt.currentTarget);
          } else {
            setInputValue(value.toString() || '');
          }
        }

        onBlur?.(evt);
      }}
    />
  );
};

export default NumberInput;
