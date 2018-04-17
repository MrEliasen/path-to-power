module.exports = {
    title: 'Password Reset',
    body: (link, ip) => `<h1>PTP Password Reset</h1>
<p>A password reset request was received from the IP: ${ip}. If you did not request this password reset, you can safely delete this email.</p>
<p>To complete the password reset, please click the link below, or copy-past it into your browser.</p>
<p>Activation Link: <a href="${link}">${link}</a></p>
<p>Regards,</br>
The PTP Team</p>`,
};
