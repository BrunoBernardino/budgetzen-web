import { html } from '/lib/utils.ts';

export default function verificationCodeModal() {
  return html`
    <template id="verification-code-modal">
      <swal-title>
        Verification Code
      </swal-title>
      <swal-html>
        <span class="text">
          You have received an email with a verification code. Type it here.
        </span>
        <form id="verification-code-form">
          <fieldset class="input-wrapper">
            <label for="verification-code-input">Code</label>
            <input
              id="verification-code-input"
              type="text"
            />
          </fieldset>
        </form>
      </swal-html>
      <swal-button type="confirm">
        Verify
      </swal-button>
      <swal-button type="cancel">
        Cancel
      </swal-button>
    </template>
  `;
}
