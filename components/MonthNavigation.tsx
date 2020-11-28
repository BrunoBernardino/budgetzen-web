import React, { useCallback } from 'react';
import moment from 'moment';
import styled from 'styled-components';

import IconButton from 'components/IconButton';
import { colors } from 'lib/constants';

interface MonthNavigationProps {
  currentMonth: string;
  handleChangeMonth: (newMonth: string) => void;
}

const Container = styled.section`
  display: flex;
  margin-top: 20;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
`;
const Text = styled.span`
  color: ${colors().inputLabel};
  width: 70%;
  padding: 0 20px;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
`;

const MonthNavigation = ({
  currentMonth,
  handleChangeMonth,
}: MonthNavigationProps) => {
  const goBack = useCallback(() => {
    const previousMonth = moment(currentMonth, 'YYYY-MM')
      .subtract(1, 'month')
      .format('YYYY-MM');
    handleChangeMonth(previousMonth);
  }, [currentMonth]);

  const goForward = useCallback(() => {
    const nextMonth = moment(currentMonth, 'YYYY-MM')
      .add(1, 'month')
      .format('YYYY-MM');
    handleChangeMonth(nextMonth);
  }, [currentMonth]);

  return (
    <Container>
      <IconButton
        onClick={goBack}
        icon="arrow-back"
        size={32}
        color={colors().inputLabel}
      />
      <Text>{moment(currentMonth, 'YYYY-MM').format('MMMM YYYY')}</Text>
      <IconButton
        onClick={goForward}
        icon="arrow-forward"
        size={32}
        color={colors().inputLabel}
      />
    </Container>
  );
};

export default MonthNavigation;
