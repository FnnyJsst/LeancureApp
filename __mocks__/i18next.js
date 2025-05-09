const i18next = jest.createMockFromModule('i18next');

i18next.use = jest.fn().mockReturnThis();
i18next.init = jest.fn().mockReturnThis();
i18next.t = jest.fn(key => key);

module.exports = i18next;