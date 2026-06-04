import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

export const DAMAGE_STATE = {
  NONE:    'none',
  SPRAYED: 'sprayed',
  CRACKED: 'cracked',
};

export const cycleDamage = (current) => {
  switch (current) {
    case DAMAGE_STATE.NONE:    return DAMAGE_STATE.SPRAYED;
    case DAMAGE_STATE.SPRAYED: return DAMAGE_STATE.CRACKED;
    case DAMAGE_STATE.CRACKED: return DAMAGE_STATE.NONE;
    default:                   return DAMAGE_STATE.NONE;
  }
};

export const DAMAGE_COLORS_2D = {
  [DAMAGE_STATE.NONE]:    '#D4E1EE',
  [DAMAGE_STATE.SPRAYED]: '#E31E24',
  [DAMAGE_STATE.CRACKED]: '#1565C0',
};

export const DAMAGE_COLORS_3D = {
  [DAMAGE_STATE.NONE]:    0xF5F5F5,
  [DAMAGE_STATE.SPRAYED]: 0xE31E24,
  [DAMAGE_STATE.CRACKED]: 0x1565C0,
};

export const HEADLIGHT_COLOR_3D = { on: 0xFFF176, off: 0x37474F };

export const INITIAL_DAMAGE = {
  hood:                 DAMAGE_STATE.NONE,
  front_bumper:         DAMAGE_STATE.NONE,
  rear_bumper:          DAMAGE_STATE.NONE,
  front_fender_left:    DAMAGE_STATE.NONE,
  front_fender_right:   DAMAGE_STATE.NONE,
  back_fender_left:     DAMAGE_STATE.NONE,
  back_fender_right:    DAMAGE_STATE.NONE,
  boot:                 DAMAGE_STATE.NONE,
  driver_door:          DAMAGE_STATE.NONE,
  front_passenger_door: DAMAGE_STATE.NONE,
  back_passenger_left:  DAMAGE_STATE.NONE,
  back_passenger_right: DAMAGE_STATE.NONE,
  roof:                 DAMAGE_STATE.NONE,
  windshield:           DAMAGE_STATE.NONE,
  rear_windshield:      DAMAGE_STATE.NONE,
  headlight_left:       false,
  headlight_right:      false,
};

export const BOOLEAN_PARTS = new Set(['headlight_left', 'headlight_right']);

const INITIAL_STATE = {
  currentStep:    1,
  brand:          null,
  model:          '',
  version:        '',
  engine:         '',
  year:           null,
  mileage:        '',
  fuel_type:      null,
  wilaya:         null,
  damage:         { ...INITIAL_DAMAGE },
  damage_details: '',
  photos: {
    front:          null,
    rear:           null,
    left_side:      null,
    right_side:     null,
    interior_front: null,
    interior_rear:  null,
    dashboard:      null,
    engine_bay:     null,
    trunk:          null,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_FIELD':
      return { ...state, [action.key]: action.value };
    case 'TOGGLE_DAMAGE': {
      const { partId } = action;
      const current    = state.damage[partId];
      const next       = BOOLEAN_PARTS.has(partId) ? !current : cycleDamage(current);
      return { ...state, damage: { ...state.damage, [partId]: next } };
    }
    case 'SET_DAMAGE_DETAILS':
      return { ...state, damage_details: action.value };
    case 'SET_PHOTO':
      return { ...state, photos: { ...state.photos, [action.slot]: action.uri } };
    case 'RESET':
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}

const AddCarContext = createContext(null);

export const AddCarProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const goToStep         = useCallback((s)    => dispatch({ type: 'SET_STEP',          payload: s }),      []);
  const setField         = useCallback((k, v) => dispatch({ type: 'SET_FIELD',         key: k, value: v }), []);
  const toggleDamage     = useCallback((id)   => dispatch({ type: 'TOGGLE_DAMAGE',     partId: id }),      []);
  const setDamageDetails = useCallback((v)    => dispatch({ type: 'SET_DAMAGE_DETAILS', value: v }),        []);
  const setPhoto         = useCallback((s, u) => dispatch({ type: 'SET_PHOTO',         slot: s, uri: u }),  []);
  const reset            = useCallback(()     => dispatch({ type: 'RESET' }),                               []);

  const damagedCount = useMemo(() =>
    Object.entries(state.damage).filter(([k, v]) =>
      BOOLEAN_PARTS.has(k) ? v === true : v !== DAMAGE_STATE.NONE
    ).length,
  [state.damage]);

  const isStep1Valid = useMemo(() =>
    !!(state.brand && state.model && state.year && state.fuel_type && state.mileage && state.wilaya),
  [state.brand, state.model, state.year, state.fuel_type, state.mileage, state.wilaya]);
  const MANDATORY = ['car'];
  const isStep3Valid = MANDATORY.every(s => state.photos[s] !== null);

  const value = useMemo(() => ({
    ...state,
    goToStep,
    setField,
    toggleDamage,
    setDamageDetails,
    setPhoto,
    reset,
    damagedCount,
    isStep1Valid,
    isStep3Valid,
    MANDATORY_SLOTS: MANDATORY,
  }), [state, damagedCount, isStep1Valid, isStep3Valid]);

  return (
    <AddCarContext.Provider value={value}>
      {children}
    </AddCarContext.Provider>
  );
};

export const useAddCar = () => {
  const ctx = useContext(AddCarContext);
  if (!ctx) throw new Error('useAddCar must be inside <AddCarProvider>');
  return ctx;
};