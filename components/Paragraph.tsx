import styled from 'styled-components';

type Props = {
  isCentered?: boolean;
};

const Paragraph = styled.p.attrs({
  className: 'common__line',
})`
  ${(props: Props) => (props.isCentered ? 'text-align: center;' : '')}
`;

export default Paragraph;
