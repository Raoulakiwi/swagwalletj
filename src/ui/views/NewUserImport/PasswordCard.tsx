import { Card } from '@/ui/component/NewUserImport';
import { openInTab } from '@/ui/utils';
import { useMemoizedFn } from 'ahooks';
import { Button, Form, Input } from 'antd';
import clsx from 'clsx';
import { sum } from 'lodash';
import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ReactComponent as RcIconCheckCC } from 'ui/assets/IconCheckedSquare.svg';
import { ReactComponent as RcIconSuccessCC } from 'ui/assets/icon-checked-success-cc.svg';
import { ReactComponent as RcIconUnCheckCC } from 'ui/assets/IconUncheckSquare.svg';

const PIN_CODE_LENGTH = 6; // Changed from MINIMUM_PASSWORD_LENGTH

const Container = styled.div`
  .ant-form-item-label {
    & > label {
      color: var(--r-neutral-title1, #192945);
      font-size: 15px;
      font-weight: 500;
      line-height: 18px;
    }
  }
  .ant-form-item {
    margin-bottom: 24px;
  }

  .ant-input {
    border-radius: 8px;
    color: var(--r-neutral-title1);
    font-size: 15px;
    height: 52px;
    background: transparent !important;
  }

  .ant-input-affix-wrapper {
    background: var(--r-neutral-bg1, #fff) !important;
    padding: 0 16px;
    overflow: hidden;
  }

  /* .ant-input {
    border-radius: 8px;
    border: 1px solid var(--r-neutral-line, #e0e5ec);
  }

  .ant-input:focus,
  .ant-input-focused {
    border-color: var(--r-blue-default, #7084ff);
  }

  .ant-form-item-has-error {
    margin-bottom: 20px;
    .ant-input {
      border: 1px solid var(--r-red-default, #e34935);
    }
  } */

  .ant-input-affix-wrapper {
    &:hover,
    &-focused,
    &-focused:hover {
      border: 2px solid var(--r-blue-default, #7084ff);
      border-right-width: 2px !important;
      border-bottom-width: 2px !important;
    }
    border-radius: 8px;
    border: 2px solid var(--r-neutral-line, #e0e5ec);
    .ant-input {
      border: none !important;
      border-radius: 0 !important;
      font-size: 16px;
      &:not(:placeholder-shown) {
        font-size: 24px;
      }
      &::placeholder {
        font-size: 16px;
      }
    }
  }
  .ant-form-item-has-error {
    .ant-input-affix-wrapper {
      border: 2px solid var(--r-red-default, #e34935);
    }
  }

  .ant-form-item-explain {
    transition: none;
  }

  .ant-form-item-explain.ant-form-item-explain-error {
    color: var(--r-red-default, #e34935);
    font-size: 14px;
    font-weight: 500;
    line-height: 16px;
    min-height: unset;
    margin-top: 10px;
  }

  .ant-input-suffix {
    display: none;
  }

  .ant-form-item-has-success {
    .ant-input-suffix {
      display: flex;
    }
  }
`;

interface Props {
  onSubmit?(password: string): void;
  onBack?(): void;
  step: 1 | 2;
}

export const PasswordCard: React.FC<Props> = ({ onSubmit, step, onBack }) => {
  const { t } = useTranslation();
  const [agreeTerm, setAgreeTerm] = useState(true);

  const [form] = Form.useForm<{
    password: string;
    confirmPassword: string;
  }>();

  const handleSubmit = useMemoizedFn(async () => {
    await form.validateFields();
    onSubmit?.(form.getFieldsValue().password);
  });

  const gotoTermsOfUse = useMemoizedFn(() => {
    openInTab('https://rabby.io/docs/terms-of-use', false);
  });

  const gotoPrivacy = useMemoizedFn(() => {
    openInTab('https://rabby.io/docs/privacy', false);
  });

  return (
    <Container>
      <Card onBack={onBack} step={step} className="flex flex-col">
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="flex flex-col flex-1"
        >
          <div className="flex-1 mt-[18px]">
            <hgroup className="mb-[24px]">
              <h1 className="text-r-neutral-title1 text-center font-semibold text-[28px] leading-[29px] mb-[9px]">
                {t('page.newUserImport.PinCard.title', 'Create New PIN Code')}
              </h1>
              <p className="text-center text-rabby-blue-default font-normal text-[16px] leading-[20px] mx-28">
                {t('page.newUserImport.PinCard.desc', 'This PIN code will be used to unlock your wallet.')}
              </p>
            </hgroup>

            <Form.Item
              name="password" // Internal name stays 'password'
              validateTrigger={['onChange', 'onSubmit']}
              label={''}
              rules={[
                {
                  required: true,
                  message: t(
                    'page.newUserImport.PinCard.form.pin.required',
                    'PIN code is required'
                  ),
                },
                {
                  len: PIN_CODE_LENGTH, // Use len for exact length
                  message: t(
                    'page.newUserImport.PinCard.form.pin.length',
                    `PIN code must be ${PIN_CODE_LENGTH} digits`
                  ),
                },
                {
                  pattern: /^[0-9]+$/,
                  message: t(
                    'page.newUserImport.PinCard.form.pin.numeric',
                    'PIN code must be numeric'
                  ),
                }
              ]}
            >
              <Input
                size="large"
                placeholder={t(
                  'page.newUserImport.PinCard.form.pin.placeholder',
                  'Enter 6-digit PIN code'
                )}
                className="text-[24px]"
                type="tel" // Changed to tel
                maxLength={PIN_CODE_LENGTH} // Added maxLength
                autoFocus
                spellCheck={false}
                suffix={
                  <span className="text-r-green-default">
                    <RcIconSuccessCC />
                  </span>
                }
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword" // Internal name stays 'confirmPassword'
              validateTrigger={['onChange', 'onSubmit']}
              label={''}
              dependencies={['password']}
              rules={[
                {
                  required: true,
                  message: t(
                    'page.newUserImport.PinCard.form.confirmPin.required',
                    'Confirm PIN code is required'
                  ),
                },
                {
                  len: PIN_CODE_LENGTH, // Use len for exact length
                  message: t(
                    'page.newUserImport.PinCard.form.pin.length', // Re-use pin length message
                    `PIN code must be ${PIN_CODE_LENGTH} digits`
                  ),
                },
                {
                  pattern: /^[0-9]+$/,
                  message: t(
                    'page.newUserImport.PinCard.form.pin.numeric', // Re-use pin numeric message
                    'PIN code must be numeric'
                  ),
                },
                ({ getFieldValue }) => ({
                  validator(_, value: string) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        t(
                          'page.newUserImport.PinCard.form.confirmPin.notMatch',
                          'The two PIN codes that you entered do not match!'
                        )
                      )
                    );
                  },
                }),
              ]}
            >
              <Input
                size="large"
                placeholder={t(
                  'page.newUserImport.PinCard.form.confirmPin.placeholder',
                  'Confirm 6-digit PIN code'
                )}
                className="text-[24px]"
                type="tel" // Changed to tel
                maxLength={PIN_CODE_LENGTH} // Added maxLength
                spellCheck={false}
                suffix={
                  <span className="text-r-green-default">
                    <RcIconSuccessCC />
                  </span>
                }
              />
            </Form.Item>
          </div>
          <Form.Item shouldUpdate noStyle>
            {(form) => {
              const passwordValue = form.getFieldValue('password');
              const confirmPasswordValue = form.getFieldValue('confirmPassword');
              const errors = form.getFieldsError();
              const isDisabled =
                !passwordValue ||
                passwordValue.length !== PIN_CODE_LENGTH ||
                !/^[0-9]*$/.test(passwordValue) ||
                !confirmPasswordValue ||
                confirmPasswordValue.length !== PIN_CODE_LENGTH ||
                !/^[0-9]*$/.test(confirmPasswordValue) ||
                passwordValue !== confirmPasswordValue ||
                errors.some(field => field.errors.length > 0) ||
                !form.isFieldsTouched(true); // Check if any field is touched
              return (
                <footer className="mt-auto">
                  <div
                    className="flex items-center justify-center gap-[4px] cursor-pointer"
                    onClick={() => {
                      setAgreeTerm((prev) => !prev);
                    }}
                  >
                    {agreeTerm ? (
                      <div className={'text-rabby-blue-default'}>
                        <RcIconCheckCC className="w-[18px] h-[18px]" />
                      </div>
                    ) : (
                      <div className={'text-r-neutral-foot'}>
                        <RcIconUnCheckCC className="w-[18px] h-[18px]" />
                      </div>
                    )}
                    <div className="text-[13px] text-r-neutral-body leading-[16px]">
                      <Trans
                        t={t}
                        i18nKey="page.newUserImport.PinCard.agree" // Updated i18n key
                      >
                        I agree to the{' '}
                        <span
                          className="text-rabby-blue-default font-medium cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            gotoTermsOfUse();
                          }}
                        >
                          Terms of Use
                        </span>
                        and
                        <span
                          className="text-rabby-blue-default font-medium cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            gotoPrivacy();
                          }}
                        >
                          Privacy Policy
                        </span>
                      </Trans>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    block
                    disabled={!agreeTerm || isDisabled}
                    type="primary"
                    className={clsx(
                      'mt-[24px] h-[56px] shadow-none rounded-[8px]',
                      'text-[17px] font-medium'
                    )}
                  >
                    {t('global.Confirm')}
                  </Button>
                </footer>
              );
            }}
          </Form.Item>
        </Form>
      </Card>
    </Container>
  );
};
