import React, { forwardRef } from 'react';
import styled from 'styled-components';

import './style.scss';

interface TextInputProps {
  label?: string;
  name: string;
  placeholder?: string;
  isDisabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'url';
  value: any;
  onChange?: any;
  onKeyDown?: any;
  onClick?: any;
  className?: string;
  ref?: any;
  id?: string;
  note?: string;
  title?: string;
}

const StyledInput = styled.input``;

const TextInput: React.FC<TextInputProps> = forwardRef(
  (props: TextInputProps, ref: any) => {
    const {
      label,
      id,
      name,
      className,
      isDisabled,
      note,
      ...remainingProps
    } = props;

    return (
      <div className={`${className || ''} TextInput`}>
        {label ? (
          <label className="TextInput__label" htmlFor={id || name}>
            {label}
          </label>
        ) : null}
        <StyledInput
          className="TextInput__input"
          disabled={isDisabled}
          id={id || name}
          name={name}
          ref={ref}
          {...remainingProps}
        />
        {note ? <p className="TextInput__note">{note}</p> : null}
      </div>
    );
  },
);

TextInput.defaultProps = {
  isDisabled: false,
  type: 'text',
};

export default TextInput;
