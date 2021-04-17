import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Rodal from 'rodal';
import { RxDatabase } from 'rxdb';

import SegmentedControl from 'components/SegmentedControl';
import Button from 'components/Button';
import IconButton from 'components/IconButton';
import ImportExportModal from 'components/ImportExportModal';
import { colors, fontSizes } from 'lib/constants';
import { doLogin, showNotification } from 'lib/utils';
import * as T from 'lib/types';

import appPackage from '../../package.json';

interface SettingsProps {
  currentCurrency: T.Currency;
  updateCurrency: (currency: T.Currency) => void;
  syncToken: string;
  db: RxDatabase;
}

// @ts-ignore manually added
const { build: appBuild, version: appVersion } = appPackage;

const SettingsButton = styled(IconButton)`
  top: 8px;
  right: 70px;
  position: absolute;
`;

const Container = styled.section`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: stretch;
  flex-direction: column;
  background-color: ${colors().background};
`;

const Label = styled.span`
  color: ${colors().inputLabel};
  font-size: ${fontSizes.inputLabel}px;
  font-weight: bold;
  text-align: left;
  margin-top: 38px;
`;

const StyledSegmentedControl = styled(SegmentedControl)`
  margin: 15px auto 10px;
  width: 96%;
`;

const BottomContainer = styled.section`
  display: flex;
  flex: 0.5;
  flex-direction: column;
`;

const Version = styled.p`
  color: ${colors().secondaryText};
  font-size: ${fontSizes.smallText}px;
  font-weight: normal;
  text-align: center;
  margin-top: 30px;
`;

const ImportExportButton = styled(Button)`
  margin: 5px auto 10px;
  align-self: center;
`;

const HelpButton = styled(Button)`
  margin: 0 auto 10px;
  align-self: center;
`;

const currencyLabels = ['$', '€', '£'];
const currencyValues: T.Currency[] = ['USD', 'EUR', 'GBP'];

const Settings = ({
  currentCurrency,
  updateCurrency,
  syncToken,
  db,
}: SettingsProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [currency, setCurrency] = useState(currentCurrency);

  useEffect(() => {
    setCurrency(currentCurrency);
  }, [currentCurrency]);

  const saveCurrency = async (newCurrency: T.Currency) => {
    if (isSubmitting) {
      // Ignore sequential taps
      return;
    }

    setIsSubmitting(true);

    const success = await doLogin(syncToken, newCurrency);

    if (success) {
      updateCurrency(newCurrency);
      return;
    }

    if (success) {
      showNotification('Settings saved successfully.');
    }
  };

  const selectedCurrencyIndex = currencyValues.findIndex(
    (_currency) => currency === _currency,
  );

  return (
    <>
      <SettingsButton
        icon="settings"
        size={26}
        color={colors().secondaryButtonBackground}
        onClick={() => setIsSettingsModalOpen(true)}
      />
      <Rodal
        visible={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        animation="slideDown"
      >
        <Container>
          <Label>Currency</Label>
          <StyledSegmentedControl
            values={currencyLabels}
            selectedIndex={
              selectedCurrencyIndex === -1 ? 0 : selectedCurrencyIndex
            }
            onChange={(selectedSegmentIndex: number) => {
              setCurrency(currencyValues[selectedSegmentIndex]);
              saveCurrency(currencyValues[selectedSegmentIndex]);
            }}
          />
          <BottomContainer>
            <Version>
              v{appVersion}-{appBuild}
            </Version>
            <ImportExportButton
              onClick={() => setIsImportExportModalOpen(true)}
              type="secondary"
            >
              Import or Export Data
            </ImportExportButton>
            <HelpButton
              element="a"
              href="mailto:help@budgetzen.net"
              type="primary"
            >
              Get Help
            </HelpButton>
          </BottomContainer>
          <ImportExportModal
            db={db}
            syncToken={syncToken}
            isOpen={isImportExportModalOpen}
            onClose={() => setIsImportExportModalOpen(false)}
          />
        </Container>
      </Rodal>
    </>
  );
};

export default Settings;
