export const BUTTON_BASE_CLASS = 'custom-btn';
export const BUTTON_ADD_CLASS = 'custom-btn--add';
export const BUTTON_DELETE_CLASS = 'custom-btn--delete';

export const BUTTON_BASE_STYLES = `
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  padding: 0;
`;

export const BUTTON_ADD_STYLES = `
  ${BUTTON_BASE_STYLES}
  background: #2196F3;
`;

export const BUTTON_DELETE_STYLES = `
  ${BUTTON_BASE_STYLES}
  background: #F44336;
  font-size: 14px;
`;