describe('template spec', () => {
  it('passes', () => {
    cy.viewport(1000, 1200);
    cy.visit('https://jeevan-04.github.io/Atithya/')
    // If the Flutter accessibility toggle is exposed, enable it so semantic labels appear
    cy.get('[aria-label="Enable accessibility"]', { timeout: 20000 })
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
    }).then(() => {
      // 1. Again click back (from phone screen or dashboard) to get to landing page
      cy.wait(2000);
      cy.contains(/Back|←|<-/i, { timeout: 10000 }).should('be.visible').click({ force: true });
      
      cy.wait(2000);
      cy.document().then(doc => {
        const hasLandingButton = [...doc.querySelectorAll('*')].some(el => 
          /ENTER AS ELITE MEMBER|Enter as Elite member/i.test(el.innerText || el.textContent || '')
        );
        if (!hasLandingButton) {
          cy.log('Not on landing page yet, clicking Back again...');
          cy.contains(/Back|←|<-/i, { timeout: 10000 }).should('be.visible').click({ force: true });
        }
      });
      // 2. Click "Enter as Royal Guest" (button text is "Continue as Royal Guest")
      cy.contains(/Royal Guest/i, { timeout: 10000 })
        .should('be.visible')
        .click({ force: true });
      
      // 3. Click PALACES, JOURNEYS, SANCTUM, DEPART THE PALACE
      clickSemanticNode('flt-semantic-node-51', /PALACES/i);
      clickSemanticNode('flt-semantic-node-52', /JOURNEYS/i);
      clickSemanticNode('flt-semantic-node-53', /SANCTUM/i);
      clickSemanticNode('flt-semantic-node-150', /DEPART THE PALACE/i);
    });

    // Helper to enter OTP into flt-semantic-node-21 (or fallback input) then click Verify & Enter
    function enterOtp(code) {
      cy.log('Using OTP: ' + code);
      
      // Find flt-semantic-node-21, click to focus, and type the OTP
      cy.document().then(doc => {
        const otpNode = doc.getElementById('flt-semantic-node-21');
        if (otpNode) {
          cy.wrap(otpNode).click({ force: true });
        }
      }).then(() => {
        // Type OTP on focused element, fallback to body
        cy.focused().then($f => {
          if ($f && $f.length) {
            cy.wrap($f).type(code, { force: true });
          } else {
            cy.get('body').type(code, { force: true });
          }
        });
      }).then(() => {
        // Click the Verify & Enter button
        cy.contains(/VERIFY & Enter|VERIFY & ENTER/i, { timeout: 5000 })
          .should('be.visible')
          .click({ force: true });
        
        // Wait a short duration to see if the page transition happens
        cy.wait(3000);
        
        cy.document().then(doc => {
          // If the OTP input (flt-semantic-node-21) or verify button is still present,
          // the verification didn't proceed ("it's not happening"), so click the Back button.
          const otpNodeStillExists = doc.getElementById('flt-semantic-node-21');
          const verifyButtonStillExists = [...doc.querySelectorAll('*')].find(el => 
            /VERIFY & Enter|VERIFY & ENTER/i.test(el.innerText || el.textContent || '')
          );
          
          if (otpNodeStillExists || verifyButtonStillExists) {
            cy.log('Verification not proceeding (still on OTP page), clicking Back button...');
            cy.contains(/Back|←|<-/i, { timeout: 5000 })
              .should('be.visible')
              .click({ force: true });
          }
        });
      });
    }

    // Helper to click a semantic node by ID, falling back to text match
    function clickSemanticNode(id, textRegex) {
      cy.wait(1000);
      cy.document().then(doc => {
        const node = doc.getElementById(id);
        if (node && textRegex.test(node.innerText || node.textContent || '')) {
          cy.wrap(node).click({ force: true });
        } else {
          cy.contains(textRegex, { timeout: 10000 }).should('be.visible').click({ force: true });
        }
      });
    }
  })
})