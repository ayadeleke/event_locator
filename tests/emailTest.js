app.post('/test-email', async (req, res) => {
  try {
    const to = 'recipient@example.com'; // Provide a recipient email
    const subject = 'Test Email';
    const message = 'This is a test email.';

    await sendEmailNotification(to, subject, message);
    res.status(200).send('Email sent successfully');
  } catch (error) {
    res.status(500).send('Error sending email: ' + error.message);
  }
});