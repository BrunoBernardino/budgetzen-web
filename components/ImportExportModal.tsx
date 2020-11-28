import React, { useState } from 'react';
import styled from 'styled-components';
import Rodal from 'rodal';
import Swal from 'sweetalert2';
import { RxDatabase } from 'rxdb';

import Button from 'components/Button';
import { showNotification } from 'lib/utils';
import { exportAllData, importData } from 'lib/data-utils';
import { colors, fontSizes } from 'lib/constants';
import * as T from 'lib/types';

type ImportedFileData = {
  budgets?: T.Budget[];
  expenses?: T.Expense[];
};

interface ImportExportModalProps {
  db: RxDatabase;
  syncToken: string;
  isOpen: boolean;
  onClose: () => void;
}

const Container = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: ${colors().background};
  padding: 0 16px;
`;

const Label = styled.label`
  color: ${colors().inputLabel};
  font-size: ${fontSizes.inputLabel}px;
  font-weight: bold;
  text-align: left;
  margin-top: 38px;
`;

const Note = styled.span`
  color: ${colors().inputLabel};
  font-size: ${fontSizes.mediumText}px;
  font-weight: normal;
  text-align: left;
  margin-top: 30px;
`;

const StyledButton = styled(Button)`
  margin-top: 20px;
  align-self: center;
`;

const ImportExportModal = (props: ImportExportModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isOpen, onClose, db, syncToken } = props;

  const onRequestImport = async () => {
    if (isSubmitting) {
      // Ignore sequential taps
      return;
    }

    const importFileDialogResult = await Swal.fire({
      icon: 'warning',
      input: 'file',
      title: 'Choose JSON File',
      inputAttributes: {
        accept: 'text/pain,application/json,.json',
        'aria-label': 'Import your budgets and expenses',
      },
    });

    if (!importFileDialogResult || !importFileDialogResult.value) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (fileRead) => {
      const importFileContents = fileRead.target.result;

      let importedFileData: ImportedFileData = {};

      try {
        importedFileData = JSON.parse(importFileContents.toString());
      } catch (error) {
        importedFileData = {};
      }

      if (
        !Object.prototype.hasOwnProperty.call(importedFileData, 'budgets') &&
        !Object.prototype.hasOwnProperty.call(importedFileData, 'expenses')
      ) {
        showNotification(
          'Could not parse the file. Please confirm what you chose is correct.',
          'error',
        );
        return;
      }

      const budgets = importedFileData.budgets || [];
      const expenses = importedFileData.expenses || [];

      const mergeOrReplaceDialogResult = await Swal.fire({
        icon: 'question',
        title: 'Merge or Replace?',
        text:
          'Do you want to merge this with your existing data, or replace it?',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Merge',
        denyButtonText: 'Replace',
        cancelButtonText: 'Wait, cancel.',
      });

      if (
        mergeOrReplaceDialogResult.isConfirmed ||
        mergeOrReplaceDialogResult.isDenied
      ) {
        setIsSubmitting(true);

        const success = await importData(
          db,
          syncToken,
          mergeOrReplaceDialogResult.isDenied,
          budgets,
          expenses,
        );

        setIsSubmitting(false);

        if (success) {
          onClose();
        }
      }
    };

    reader.readAsDataURL(importFileDialogResult.value);
  };

  const onRequestExport = async () => {
    if (isSubmitting) {
      // Ignore sequential taps
      return;
    }

    setIsSubmitting(true);

    const fileName = `data-export-${new Date()
      .toISOString()
      .substr(0, 19)
      .replace(/:/g, '-')}.json`;

    const exportData = await exportAllData(db);

    const exportContents = JSON.stringify(exportData, null, 2);

    // Add content-type
    const jsonContent = `data:application/json;charset=utf-8,${exportContents}`;

    // Download the file
    const data = encodeURI(jsonContent);
    const link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', fileName);
    link.click();
    link.remove();

    setIsSubmitting(false);

    showNotification('Data exported successfully!');
  };

  return (
    <Rodal visible={isOpen} onClose={onClose} animation="slideDown">
      <Container>
        <Label>Import</Label>
        <Note>Import a JSON file exported from Budget Zen before.</Note>

        <StyledButton
          element="a"
          href="https://budgetzen.net/import-export-file-format"
          type="secondary"
        >
          Learn more
        </StyledButton>

        <StyledButton onClick={() => onRequestImport()} type="secondary">
          Import Data
        </StyledButton>

        <StyledButton onClick={() => onRequestExport()} type="primary">
          Export Data
        </StyledButton>
      </Container>
    </Rodal>
  );
};

export default ImportExportModal;
