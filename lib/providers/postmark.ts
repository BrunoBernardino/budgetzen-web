import 'std/dotenv/load.ts';

import { helpEmail } from '/lib/utils.ts';

const POSTMARK_SERVER_API_TOKEN = Deno.env.get('POSTMARK_SERVER_API_TOKEN') || '';

interface PostmarkResponse {
  To: string;
  SubmittedAt: string;
  MessageID: string;
  ErrorCode: number;
  Message: string;
}

type TemplateAlias =
  | 'verify-login'
  | 'verify-delete'
  | 'verify-update'
  | 'update-billing-email'
  | 'subscription-expired';

function getApiRequestHeaders() {
  return {
    'X-Postmark-Server-Token': POSTMARK_SERVER_API_TOKEN,
    'Accept': 'application/json; charset=utf-8',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

interface PostmarkEmailWithTemplateRequestBody {
  TemplateId?: number;
  TemplateAlias: TemplateAlias;
  TemplateModel: {
    [key: string]: any;
  };
  InlineCss?: boolean;
  From: string;
  To: string;
  Cc?: string;
  Bcc?: string;
  Tag?: string;
  ReplyTo?: string;
  Headers?: { Name: string; Value: string }[];
  TrackOpens?: boolean;
  TrackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly';
  Attachments?: { Name: string; Content: string; ContentType: string }[];
  Metadata?: {
    [key: string]: string;
  };
  MessageStream: 'outbound' | 'broadcast';
}

async function sendEmailWithTemplate(
  to: string,
  templateAlias: TemplateAlias,
  data: PostmarkEmailWithTemplateRequestBody['TemplateModel'],
  attachments: PostmarkEmailWithTemplateRequestBody['Attachments'] = [],
  cc?: string,
) {
  const email: PostmarkEmailWithTemplateRequestBody = {
    From: helpEmail,
    To: to,
    TemplateAlias: templateAlias,
    TemplateModel: data,
    MessageStream: 'outbound',
  };

  if (attachments?.length) {
    email.Attachments = attachments;
  }

  if (cc) {
    email.Cc = cc;
  }

  const postmarkResponse = await fetch('https://api.postmarkapp.com/email/withTemplate', {
    method: 'POST',
    headers: getApiRequestHeaders(),
    body: JSON.stringify(email),
  });
  const postmarkResult = (await postmarkResponse.json()) as PostmarkResponse;

  if (postmarkResult.ErrorCode !== 0 || postmarkResult.Message !== 'OK') {
    console.log(JSON.stringify({ postmarkResult }, null, 2));
    throw new Error(`Failed to send email "${templateAlias}"`);
  }
}

export async function sendVerifyLoginEmail(
  email: string,
  verificationCode: string,
) {
  const data = {
    verificationCode,
  };

  await sendEmailWithTemplate(email, 'verify-login', data);
}

export async function sendVerifyDeleteDataEmail(
  email: string,
  verificationCode: string,
) {
  const data = {
    verificationCode,
    deletionSubject: 'all your data',
  };

  await sendEmailWithTemplate(email, 'verify-delete', data);
}

export async function sendVerifyDeleteAccountEmail(
  email: string,
  verificationCode: string,
) {
  const data = {
    verificationCode,
    deletionSubject: 'your account',
  };

  await sendEmailWithTemplate(email, 'verify-delete', data);
}

export async function sendVerifyUpdateEmailEmail(
  email: string,
  verificationCode: string,
) {
  const data = {
    verificationCode,
    updateSubject: 'your email',
  };

  await sendEmailWithTemplate(email, 'verify-update', data);
}

export async function sendVerifyUpdatePasswordEmail(
  email: string,
  verificationCode: string,
) {
  const data = {
    verificationCode,
    updateSubject: 'your password',
  };

  await sendEmailWithTemplate(email, 'verify-update', data);
}

export async function sendUpdateEmailInProviderEmail(
  oldEmail: string,
  newEmail: string,
) {
  const data = {
    oldEmail,
    newEmail,
  };

  await sendEmailWithTemplate(helpEmail, 'update-billing-email', data);
}

export async function sendSubscriptionExpiredEmail(
  email: string,
) {
  await sendEmailWithTemplate(email, 'subscription-expired', {});
}
