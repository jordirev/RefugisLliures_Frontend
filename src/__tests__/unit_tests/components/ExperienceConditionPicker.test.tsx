import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExperienceConditionPicker } from '../../../components/ExperienceConditionPicker';

describe('ExperienceConditionPicker', () => {
  it('hauria de mostrar les 4 opcions (0-3) i el missatge obligatori sense valor', async () => {
    const { getByTestId } = await render(<ExperienceConditionPicker onChange={jest.fn()} />);

    [0, 1, 2, 3].forEach((v) => expect(getByTestId(`experience-condition-${v}`)).toBeTruthy());
    expect(getByTestId('experience-condition-required')).toBeTruthy();
  });

  it('hauria d\'amagar el missatge obligatori quan hi ha valor', async () => {
    const { queryByTestId } = await render(<ExperienceConditionPicker value={0} onChange={jest.fn()} />);

    expect(queryByTestId('experience-condition-required')).toBeNull();
  });

  it('hauria de cridar onChange amb el valor numèric (inclòs el 0)', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(<ExperienceConditionPicker onChange={onChange} />);

    await fireEvent.press(getByTestId('experience-condition-0'));
    await fireEvent.press(getByTestId('experience-condition-3'));

    expect(onChange).toHaveBeenNthCalledWith(1, 0);
    expect(onChange).toHaveBeenNthCalledWith(2, 3);
  });

  it('no hauria de cridar onChange si està desactivat', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(<ExperienceConditionPicker onChange={onChange} disabled />);

    await fireEvent.press(getByTestId('experience-condition-1'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
