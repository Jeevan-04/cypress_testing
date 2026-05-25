describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://jeevan-04.github.io/Atithya/')
    // If the Flutter accessibility toggle is exposed, enable it so semantic labels appear
    cy.get('[aria-label="Enable accessibility"]', { timeout: 2000 })
      .then($el => {
        if ($el.length) cy.wrap($el).click({ force: true });
      });

    // Click the Enter as Elite member button once semantics are available
    cy.contains(/ENTER AS ELITE MEMBER|Enter as Elite member/i, { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });
    cy.get('input').first().clear().type('1234567890');

    // Click Send OTP (prefer flt-semantic-node-16)
    cy.document().then(doc => {
      const sendNode = doc.getElementById('flt-semantic-node-16');
      if (sendNode) {
        cy.wrap(sendNode).click({ force: true });
      } else {
        cy.contains(/Send OTP|SEND OTP/i, { timeout: 10000 }).should('be.visible').click({ force: true });
      }
    });

    // Wait for the DEV OTP text to appear and extract the numeric OTP
    cy.contains(/DEV\s*OTP/i, { timeout: 15000 }).invoke('text').then(text => {
      const m = text.match(/\b(\d{4,6})\b/);
      const otp = m ? m[1] : '';
      if (!otp) {
        // try scanning whole document as fallback
        cy.document().then(d => {
          const all = d.body.innerText || '';
          const mm = all.match(/\b(\d{4,6})\b/);
          return mm ? mm[1] : '';
        }).then(found => {
          const finalOtp = found || '0000';
          enterOtp(finalOtp);
        });
      } else {
        enterOtp(otp);
      }
    });

    // Helper to enter OTP into flt-semantic-node-21 (or fallback input) then click send node16
    function enterOtp(code) {
      cy.log('Using OTP: ' + code);
      // If an element is already focused, type directly. Otherwise send keystrokes to the page.
      cy.focused().then($f => {
        if ($f && $f.length) {
          cy.focused().type(code, { force: true });
        } else {
          // click body to ensure the page has focus, then type
          cy.get('body').click(0, 0, { force: true }).type(code, { force: true });
        }
      }).then(() => {
        // After entering OTP, click send (flt node 16) again to submit
        cy.document().then(d => {
          const sendNode2 = d.getElementById('flt-semantic-node-16');
          if (sendNode2) cy.wrap(sendNode2).click({ force: true });
          else cy.contains(/VERIFY & Enter/i, { timeout: 5000 }).click({ force: true });
        });
      });
    }
  })
})