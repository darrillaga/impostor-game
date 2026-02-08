let counter = 0;

module.exports = {
  nanoid: jest.fn(() => {
    counter++;
    return `test-id-${counter.toString().padStart(6, '0')}`;
  }),
};
