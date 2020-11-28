import React from 'react';
import renderer from 'react-test-renderer';
import { shallow } from 'enzyme';
import expect from 'expect';
import enzymify from 'expect-enzyme';

import Button from './index';

expect.extend(enzymify());

describe('Button', () => {
  it('renders the button without errors', () => {
    const wrapper = shallow(<Button>Hello</Button>);
    expect(wrapper.first().text()).toBe('Hello');
  });

  it('renders the button as expected', () => {
    const tree = renderer.create(<Button>Hello</Button>).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
