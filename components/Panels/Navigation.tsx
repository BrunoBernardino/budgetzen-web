import React from 'react';
import styled from 'styled-components';

import MonthNavigation from 'components/MonthNavigation';

interface NavigationProps {
  changeMonthInView: (month: string) => void;
  monthInView: string;
}

const Container = styled.section`
  display: block;
  overflow: auto;
`;

const Navigation = ({ changeMonthInView, monthInView }: NavigationProps) => {
  return (
    <Container>
      <MonthNavigation
        currentMonth={monthInView}
        handleChangeMonth={changeMonthInView}
      />
    </Container>
  );
};

export default Navigation;
