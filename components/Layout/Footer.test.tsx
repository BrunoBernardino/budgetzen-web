import React from 'react';
import { shallow } from 'enzyme';
import expect from 'expect';
import enzymify from 'expect-enzyme';

import Footer from './Footer';

expect.extend(enzymify());

describe('Footer', () => {
  it('renders the Footer with a link', () => {
    const wrapper = shallow(<Footer />);
    expect(
      wrapper.find('a[href="https://brunobernardino.com"]').length,
    ).toEqual(1);
  });
});
