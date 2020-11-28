import React from 'react';
import { shallow } from 'enzyme';
import expect from 'expect';
import enzymify from 'expect-enzyme';

import Loading from './index';

expect.extend(enzymify());

describe('Loading', () => {
  it('renders the loading hidden', () => {
    const wrapper = shallow(<Loading />);
    expect(wrapper.find('.Loading--show').exists()).toBe(false);
  });

  it('renders the loading visible', () => {
    const wrapper = shallow(<Loading isShowing />);
    expect(wrapper.find('.Loading--show').exists()).toBe(true);
  });
});
