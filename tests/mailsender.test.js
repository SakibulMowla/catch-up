const MailSender = require('../src/mailsender');

test('email seding successful', async () => {
  const successMessage = 'email sending successful! :)';
  const requestMock = jest.fn(() => Promise.resolve({ body: successMessage }));
  const mailjet = {
    post: () => (
      {
        request: requestMock,
      }
    ),
  };
  const mainSender = new MailSender({ mailjet, tier: 'dev' });
  const response = await mainSender.sendMail(
    {
      email: 'sakibulmowla@gmail.com',
      firstname: 'Sakibul',
      lastname: 'Mowla',
    },
    {
      email: 'sakibul_mowla@yahoo.com',
      firstname: 'Anothersakibul',
      lastname: 'Anothermowla',
    },
  );
  expect(response.body).toBe(successMessage);
  expect(requestMock.mock.calls.length).toBe(1);
});

test('mailjet is not called when userB is invalid', async () => {
  const successMessage = 'email sending successful! :)';
  const requestMock = jest.fn(() => Promise.resolve({ body: successMessage }));
  const mailjet = {
    post: () => (
      {
        request: requestMock,
      }
    ),
  };
  const mainSender = new MailSender({ mailjet, tier: 'dev' });
  try {
    await mainSender.sendMail(
      {
        email: 'sakibulmowla@gmail.com',
        firstname: 'Sakibul',
        lastname: 'Mowla',
      },
    );
  } catch (e) {
    expect(requestMock.mock.calls.length).toBe(0);
  }
});
