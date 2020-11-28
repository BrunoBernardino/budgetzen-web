import styled from 'styled-components';

const Title = styled.h1.attrs({
  className: 'common__line',
})`
  font-size: 3.5em;
  font-weight: bold;
  text-align: left;
  line-height: 1.2em;
  color: #666;
  margin-top: 1em;

  @media (prefers-color-scheme: dark) {
    color: #f0f0f0;
  }

  &:after {
    display: block;
    content: ' ';
    width: 2em;
    height: 3px;
    margin-top: 0.15em;
    margin-bottom: 1em;
    background-color: #666;

    @media (prefers-color-scheme: dark) {
      background-color: #f0f0f0;
    }
  }
`;

export default Title;
