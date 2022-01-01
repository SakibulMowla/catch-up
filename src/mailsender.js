const fs = require('fs');
const { ADMIN } = require('./constants');

class MailSender {
  constructor({ mailjet, tier = 'dev' }) {
    this.mailjet = mailjet;
    this.tier = tier;
    this.emailTemplate = JSON.parse(fs.readFileSync('emailtemplate.json', 'utf8'));
    this.emailSubject = this.emailTemplate.subject;
    this.emailBodyTemplate = this.emailTemplate.bodyparts.join('\n');
  }

  sendMail(userA, userB) {
    if (!userA || !userB) {
      return Promise.reject(Error(`One or both users invlid. userA = ${JSON.stringify(userA, null, 2)}, userB = ${JSON.stringify(userB, null, 2)}`));
    }

    const userAFullname = `${userA.firstname} ${userA.lastname}`;
    const userBFullname = `${userB.firstname} ${userB.lastname}`;
    const emailBody = this.emailBodyTemplate
      .replace('{person_1_name}', userAFullname)
      .replace('{person_2_name}', userBFullname)
      .replace('{host_email_address}', ADMIN.EMAIL);

    const request = this.mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: ADMIN.EMAIL,
              Name: ADMIN.FULLNAME,
            },
            Subject: this.tier === 'dev' ? 'Ignore: Testing Catchup Email' : this.emailSubject,
            TextPart: emailBody,
            To: [
              {
                Email: userA.email,
                Name: userAFullname,
              },
              {
                Email: userB.email,
                Name: userBFullname,
              },
            ],
          },
        ],
      });
    return request;
  }
}

module.exports = MailSender;
