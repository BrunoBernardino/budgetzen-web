import styled from 'styled-components';

type Props = {
  isCentered?: boolean;
  isBold?: boolean;
};

const Paragraph = styled.p.attrs({
  className: 'common__line',
})`
  ${(props: Props) => (props.isCentered ? 'text-align: center;' : '')}
  ${(props: Props) => (props.isBold ? 'font-weight: bold;' : '')}
`;

export default Paragraph;
