import React from 'react';
import styled from 'styled-components';

import { colors, fontSizes } from 'lib/constants';

interface SegmentedControlProps {
  values: string[];
  selectedIndex: number;
  onChange: (selectedSegmentIndex: number) => void;
  className?: string;
}

const Container = styled.section`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  color: ${colors().secondaryText};
  background-color: ${colors().secondaryBackground};
  border-radius: 5px;
  padding: 3px;
`;

type SegmentProps = {
  selected?: boolean;
};

const Segment = styled.button<SegmentProps>`
  align-items: center;
  border: none;
  background-color: ${({ selected }) =>
    selected ? colors().primaryButtonBackground : 'transparent'};
  padding: 10px;
  border-radius: 5px;
  min-width: 33%;
  color: ${({ selected }) =>
    selected ? colors().primaryButtonText : 'inherit'};
  font-size: ${fontSizes.button}px;
  cursor: pointer;
  outline: none;
  &:hover,
  &:focus,
  &:active {
    opacity: 0.8;
  }
`;

const SegmentedControl = ({
  values,
  selectedIndex,
  onChange,
  className,
}: SegmentedControlProps) => {
  return (
    <Container className={className}>
      {values.map((value: string, index: number) => (
        <Segment
          key={`segment-${index}`}
          selected={selectedIndex === index}
          onClick={() => onChange(index)}
        >
          {value}
        </Segment>
      ))}
    </Container>
  );
};

export default SegmentedControl;
