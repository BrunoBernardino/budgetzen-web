import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Rodal from 'rodal';
import Link from 'next/link';

import SegmentedControl from 'components/SegmentedControl';
import Button from 'components/Button';
import IconButton from 'components/IconButton';
import ImportExportModal from 'components/ImportExportModal';
import Paragraph from 'components/Paragraph';
import { colors, fontSizes } from 'lib/constants';
import { updatePreferences, showNotification } from 'lib/utils';
import * as T from 'lib/types';

import appPackage from '../../package.json';

interface SettingsProps {
  currentCurrency: T.Currency;
  updateCurrency: (currency: T.Currency) => void;
  currentTheme: T.Theme;
  updateTheme: (theme: T.Theme) => void;
  setIsLoading: (isLoading: boolean) => void;
  reloadData: () => Promise<void>;
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

const currencyLabels = ['$', '€', '£'];
const currencyValues: T.Currency[] = ['USD', 'EUR', 'GBP'];

const themeLabels = ['Light', 'Dark'];
const themeValues: T.Theme[] = ['light', 'dark'];

const Settings = ({
  currentCurrency,
  updateCurrency,
  currentTheme,
  updateTheme,
  setIsLoading,
  reloadData,
}: SettingsProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [currency, setCurrency] = useState(currentCurrency);
  const [theme, setTheme] = useState(currentTheme);

  useEffect(() => {
    setCurrency(currentCurrency);
  }, [currentCurrency]);

  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  const saveCurrency = async (newCurrency: T.Currency) => {
    if (isSubmitting) {
      // Ignore sequential taps
      return;
    }

    setIsSubmitting(true);

    const success = updatePreferences(newCurrency, currentTheme);

    if (success) {
      updateCurrency(newCurrency);
      return;
    }

    if (success) {
      showNotification('Settings saved successfully.');
    }
  };

  const saveTheme = async (newTheme: T.Theme) => {
    if (isSubmitting) {
      // Ignore sequential taps
      return;
    }

    setIsSubmitting(true);

    const success = updatePreferences(currentCurrency, newTheme);

    if (success) {
      updateTheme(newTheme);
      return;
    }

    if (success) {
      showNotification('Settings saved successfully.');
    }
  };

  const selectedCurrencyIndex = currencyValues.findIndex(
    (_currency) => currency === _currency,
  );

  const selectedThemeIndex = themeValues.findIndex(
    (_theme) => theme === _theme,
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
          <Label>Theme</Label>
          <StyledSegmentedControl
            values={themeLabels}
            selectedIndex={selectedThemeIndex === -1 ? 0 : selectedThemeIndex}
            onChange={(selectedSegmentIndex: number) => {
              setTheme(themeValues[selectedSegmentIndex]);
              saveTheme(themeValues[selectedSegmentIndex]);
            }}
          />
          <Paragraph isCentered style={{ marginTop: '2rem' }}>
            <Link href="/email-password">
              <a>Change your email or password</a>
            </Link>
          </Paragraph>
          <Paragraph isCentered>
            <Link href="/billing">
              <a>Manage billing</a>
            </Link>
          </Paragraph>
          <BottomContainer>
            <Version>
              v{appVersion}-{appBuild}
            </Version>
            <Button
              onClick={() => setIsImportExportModalOpen(true)}
              type="secondary"
              style={{
                margin: '5px auto 10px',
                alignSelf: 'center',
              }}
            >
              Import or Export Data
            </Button>
            <Button
              element="a"
              href="mailto:help@budgetzen.net"
              type="primary"
              style={{
                margin: '0 auto 10px',
                alignSelf: 'center',
              }}
            >
              Get Help
            </Button>
          </BottomContainer>
          <ImportExportModal
            isOpen={isImportExportModalOpen}
            onClose={async () => {
              setIsImportExportModalOpen(false);
              await reloadData();
            }}
            setIsLoading={setIsLoading}
          />
        </Container>
      </Rodal>
    </>
  );
};

export default Settings;
