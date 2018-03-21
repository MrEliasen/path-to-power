module.exports = {
    title: 'Email Verification',
    body: (link) => `<h1>PTP Email Verification<h1>
<p>Before you can login with your new email, you must verify it by clicking the link below, or copy paste it into your browser's address bar.</p>
<p>Verification Link: <a href="${link}">${link}</a></p>
<p>The PTP Team</p>`,
};
