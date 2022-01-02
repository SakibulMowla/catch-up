const axios = require('axios');
const MailSender = require('../src/mailsender');

test('email seding successful', async () => {
  const successMessage = 'email sending successful! :)';
  const mockPostResponse = jest.fn(() => Promise.resolve({ body: successMessage }));
  axios.post.mockImplementation(mockPostResponse);

  const mailSender = new MailSender('dev');
  const response = await mailSender.sendMail(
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
  expect(mockPostResponse).toHaveBeenCalled();
  expect(response.body).toBe(successMessage);
});

test('axios is not called when userB is invalid', async () => {
  const mockPostResponse = jest.fn(() => {});
  axios.post.mockImplementation(mockPostResponse);

  const mailSender = new MailSender('dev');
  try {
    await mailSender.sendMail(
      {
        email: 'sakibulmowla@gmail.com',
        firstname: 'Sakibul',
        lastname: 'Mowla',
      },
    );
  } catch (e) {
    expect(mockPostResponse).not.toHaveBeenCalled();
  }
});
