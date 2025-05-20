import React, { useState } from 'react';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

interface PlanDetail {
  id: string;
  plan: string;
  status: string;
  users: {
    current: number;
    max: number;
  };
  nextInvoice: string;
  paymentMethod: {
    type: string;
    lastFour?: string;
    expiry?: string;
    email?: string;
  };
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: string;
  users: string;
}

const SubscriptionPlan = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string>('standard');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Sample plans data
  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free Plan',
      price: 0,
      description: 'Essential features with limited access ideal for small teams',
      features: [
        'Essential AI chatbot access',
        'Limited user interactions',
        'Basic reports & analytics',
        'Standard customer support',
        'Suitable for individuals'
      ]
    },
    {
      id: 'standard',
      name: 'Standard Plan',
      price: 24,
      description: 'Expanded features with more access perfect for growing teams.',
      features: [
        'Essential AI chatbot access',
        'Limited user interactions',
        'Basic reports & analytics',
        'Standard customer support',
        'Suitable for individuals',
        'Full AI chatbot functionality',
        'Customizable workflows',
        'Role-based access control'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 72,
      description: 'Advanced features with full access ideal for large teams and enterprises.',
      features: [
        'Essential AI chatbot access',
        'Limited user interactions',
        'Basic reports & analytics',
        'Standard customer support',
        'Suitable for individuals',
        'Full AI chatbot functionality',
        'Customizable workflows',
        'Role-based access control'
      ]
    },
    {
      id: 'custom',
      name: 'Custom Plan',
      price: 120,
      description: 'Fully customizable solutions to match your business needs scalable and flexible',
      features: [
        'Essential AI chatbot access',
        'Limited user interactions',
        'Basic reports & analytics',
        'Standard customer support',
        'Suitable for individuals',
        'Full AI chatbot functionality',
        'Customizable workflows',
        'Role-based access control'
      ]
    }
  ];
  
  // Sample plan details
  const planDetail: PlanDetail = {
    id: '123',
    plan: 'standard',
    status: 'Active',
    users: {
      current: 10,
      max: 15
    },
    nextInvoice: '08/2026',
    paymentMethod: {
      type: 'visa',
      lastFour: '1234',
      expiry: '08/2026',
      email: 'company@gmail.com'
    }
  };
  
  // Sample invoices data
  const invoices: Invoice[] = [
    {
      id: '1',
      number: 'Invoice-11',
      date: 'December 07, 2024',
      amount: '$24',
      users: '1226 members'
    },
    {
      id: '2',
      number: 'Invoice-10',
      date: 'January 07, 2024',
      amount: '$24',
      users: '1220 members'
    },
    {
      id: '3',
      number: 'Invoice-09',
      date: 'February 07, 2024',
      amount: '$24',
      users: '1214 members'
    },
    {
      id: '4',
      number: 'Invoice-08',
      date: 'March 07, 2024',
      amount: '$24',
      users: '1210 members'
    },
    {
      id: '5',
      number: 'Invoice-08',
      date: 'March 07, 2024',
      amount: '$24',
      users: '1210 members'
    }
  ];
  
  // FAQ data
  const faqs = [
    {
      id: 'payment-methods',
      question: 'What payment methods do you accept?',
      answer: 'We accept credit/debit cards, bank transfers, and digital payment options. Available payment methods may vary depending on your region.'
    }
  ];
  
  const handleBuyCycle = (planId: string) => {
    setSelectedPlan(planId);
    console.log(`Selected ${planId} plan with ${billingCycle} billing cycle`);
    // API call would go here
  };
  
  const handleToggleFaq = (faqId: string) => {
    if (expandedFaq === faqId) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(faqId);
    }
  };
  
  const handleChangePage = (page: number) => {
    setCurrentPage(page);
  };
  
  return (
    <div className="subscription-plan-container">
      <div className="plan-selection-section">
        <h1 className="page-title">Subscription Plan</h1>
        <p className="page-description">Choose your plan and experience the exclusive features of software</p>
        
        <div className="billing-toggle">
          <button 
            className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`billing-option ${billingCycle === 'annually' ? 'active' : ''}`}
            onClick={() => setBillingCycle('annually')}
          >
            Annually
          </button>
        </div>
        
        <div className="plans-grid">
          {plans.map(plan => (
            <div 
              key={plan.id} 
              className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
            >
              <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">
                  <span className="price">${plan.price}</span>
                  <span className="price-period">/month</span>
                </div>
                <p className="plan-description">{plan.description}</p>
              </div>
              
              <div className="plan-features">
                <h4 className="plan-includes">{plan.name} includes:</h4>
                <ul className="features-list">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <span className="check-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button 
                className="buy-plan-button"
                onClick={() => handleBuyCycle(plan.id)}
              >
                Buy Plan
              </button>
            </div>
          ))}
        </div>
        
        <div className="faq-section">
          <h2 className="faq-title">FAQ</h2>
          <p className="faq-subtitle">Here are some Frequently Asked Questions (FAQs) related to Payments</p>
          
          <div className="faq-list">
            {faqs.map(faq => (
              <div key={faq.id} className="faq-item">
                <div 
                  className="faq-question"
                  onClick={() => handleToggleFaq(faq.id)}
                >
                  <span>{faq.question}</span>
                  <span className={`arrow-icon ${expandedFaq === faq.id ? 'expanded' : ''}`}>▼</span>
                </div>
                {expandedFaq === faq.id && (
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="current-plan-section">
        <h2 className="section-title">Plans and Billing</h2>
        <p className="section-description">Manage your plans and billings</p>
        
        <div className="current-plan-details">
          <div className="plan-info">
            <div className="plan-status">
              <h3 className="plan-name">{plans.find(p => p.id === planDetail.plan)?.name}</h3>
              <span className="plan-badge">{planDetail.status}</span>
            </div>
            <p className="plan-description">{plans.find(p => p.id === planDetail.plan)?.description}</p>
            
            <div className="plan-users">
              <div className="users-icons">
                {/* Sample user avatars */}
                <div className="user-avatar">AR</div>
                <div className="user-avatar">BS</div>
                <div className="user-avatar">CW</div>
                <div className="user-avatar">DT</div>
                <div className="user-avatar">EK</div>
                <div className="user-count">+{planDetail.users.current - 5}</div>
              </div>
              <div className="users-count">{planDetail.users.current} of {planDetail.users.max} Users</div>
            </div>
            
            <button className="upgrade-button">Upgrade Plan</button>
          </div>
          
          <div className="payment-info">
            <h3 className="payment-title">Payment method</h3>
            <p className="payment-subtitle">Choose how you pay for your plan</p>
            
            <div className="card-details">
              <div className="card-icon">
                {planDetail.paymentMethod.type === 'visa' && '💳'}
              </div>
              <div className="card-info">
                <div className="card-number">
                  Visa ending in {planDetail.paymentMethod.lastFour}
                  <span className="default-badge">• Default</span>
                </div>
                <div className="card-expiry">Expiry {planDetail.paymentMethod.expiry}</div>
                <div className="card-email">{planDetail.paymentMethod.email}</div>
              </div>
              <button className="edit-payment-button">✏️</button>
            </div>
          </div>
        </div>
        
        <div className="billing-history">
          <h3 className="section-title">Billing History</h3>
          <p className="section-description">Download your Previous plan receipts and usage details</p>
          
          <table className="invoices-table">
            <thead>
              <tr>
                <th className="checkbox-column">
                  <input type="checkbox" />
                </th>
                <th>Invoice</th>
                <th>Billing date</th>
                <th>Amount</th>
                <th>Users</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => (
                <tr key={invoice.id}>
                  <td className="checkbox-column">
                    <input type="checkbox" />
                  </td>
                  <td>{invoice.number}</td>
                  <td>{invoice.date}</td>
                  <td>{invoice.amount}</td>
                  <td>{invoice.users}</td>
                  <td className="download-column">
                    <button className="download-button">⬇️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="pagination">
            <button 
              className="pagination-button prev"
              onClick={() => handleChangePage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            
            {[1, 2, 3, '...', 8, 9, 10].map((page, index) => (
              <button 
                key={index}
                className={`pagination-number ${page === currentPage ? 'active' : ''} ${page === '...' ? 'ellipsis' : ''}`}
                onClick={() => typeof page === 'number' && handleChangePage(page)}
                disabled={page === '...'}
              >
                {page}
              </button>
            ))}
            
            <button 
              className="pagination-button next"
              onClick={() => handleChangePage(currentPage + 1)}
              disabled={currentPage === 10}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlan; 