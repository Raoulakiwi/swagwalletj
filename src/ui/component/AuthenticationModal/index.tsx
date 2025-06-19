import { Button, DrawerProps, Form, Input } from 'antd';
import styled from 'styled-components';
import clsx from 'clsx';
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Popup, Checkbox, Field } from 'ui/component';
import { WrappedComponentProps, wrapModalPromise } from '../Modal/WrapPromise';
import { getUiType } from '@/ui/utils';
const isTab = getUiType().isTab;

const AuthFormItemWrapper = styled.div`
  .ant-form-item-has-error {
    .ant-input {
      border-color: #f24822 !important;
    }
  }
  .ant-input.ant-input-lg.popup-input {
    border: 1px solid var(--r-neutral-line, #d3d8e0) !important;
    background: transparent !important;
    &::placeholder {
      color: var(--r-neutral-foot, #6a7587) !important;
    }
    &:focus,
    &:hover {
      border-color: var(--r-blue-default, #7084ff) !important;
    }
  }
`;

interface AuthenticationModalProps extends WrappedComponentProps {
  validationHandler?(password: string): Promise<void>;
  confirmText?: string;
  cancelText?: string;
  title?: string;
  description?: string;
  checklist?: string[];
  placeholder?: string;
  getContainer?: DrawerProps['getContainer'];
}

const Description = styled.div`
  margin-bottom: 20px;
  font-weight: 400;
  font-size: 14px;
  line-height: 16px;
  text-align: center;
  color: var(--r-neutral-body, #d3d8e0);
`;

const FieldList = styled.div`
  margin-bottom: 20px;

  .field {
    background: var(--r-neutral-card-2, rgba(255, 255, 255, 0.06));
    border-radius: 6px;
    padding: 16px 12px;

    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    color: var(--r-neutral-title-1, #f7fafc);
    border: 1px solid transparent;
    margin-bottom: 8px;

    &:hover {
      background-color: rgba(134, 151, 255, 0.2);
      border: 1px solid var(--r-blue-default, #7084ff);
    }

    &:nth-last-child(1) {
      margin-bottom: 0;
    }
  }
`;

function useQuestionsCheck(checklist: string[]) {
  const QUESTIONS = React.useMemo(() => {
    return checklist.map((item, index) => ({
      index,
      content: item,
      checked: false,
    }));
  }, []);

  const [questionChecks, setQuestionChecks] = React.useState(QUESTIONS);

  type TIndex = typeof QUESTIONS[number]['index'];
  const toggleCheckedByIndex = React.useCallback((index: TIndex) => {
    setQuestionChecks((prev) => {
      const idx = prev.findIndex((item) => item.index === index);

      prev[idx].checked = !prev[idx].checked;

      return [...prev];
    });
  }, []);

  const reset = useCallback(() => {
    setQuestionChecks((prev) => {
      return prev.map((item) => ({
        ...item,
        checked: false,
      }));
    });
  }, []);

  return {
    questionChecks,
    isAllChecked: React.useMemo(
      () => questionChecks.every((item) => item.checked),
      [questionChecks]
    ),
    toggleCheckedByIndex,
    reset,
  };
}

const AuthenticationModal = ({
  description,
  checklist = [],
  validationHandler,
  onFinished,
  onCancel,
  wallet,
  cancelText,
  confirmText = 'Confirm',
  title = 'Enter PIN code', // Changed default title
  placeholder,
  getContainer,
}: AuthenticationModalProps) => {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const inputRef = useRef<Input>(null);
  const {
    questionChecks,
    isAllChecked,
    toggleCheckedByIndex,
    reset,
  } = useQuestionsCheck(checklist);
  const height = useMemo(() => {
    if (!description && checklist.length <= 0) return 240;
    if (description && checklist.length <= 0) return 280;
    return 480;
  }, [description, checklist]);

  const handleSubmit = async ({ password }: { password: string }) => {
    try {
      if (validationHandler) {
        await validationHandler(password);
      } else {
        await wallet?.verifyPassword(password);
      }
      onFinished();
      setVisible(false);
    } catch (e: any) {
      form.setFields([
        {
          name: 'password', // Internal name remains 'password'
          errors: [
            e?.message || t('component.AuthenticationModal.pinError', 'Incorrect PIN code'),
          ],
        },
      ]);
    }
  };

  const handleCancel = () => {
    setVisible(false);
    onCancel();
  };

  useEffect(() => {
    setTimeout(() => {
      setVisible(true);
      inputRef.current?.focus();
    });
  }, []);

  return (
    <Popup
      className={clsx('input-password-popup', { 'has-desc': !!description })} // CSS class name can remain if it's generic
      visible={visible}
      title={title} // Title is now PIN-related by default or via prop
      onCancel={handleCancel}
      height={height}
      isSupportDarkMode
      getContainer={getContainer}
      push={false}
      key={String(visible)}
    >
      {description && <Description>{description}</Description>}
      {checklist.length > 0 && (
        <FieldList>
          {questionChecks.map((q) => {
            const handleClickItem = () => {
              toggleCheckedByIndex(q.index);
            };
            return (
              <Field
                key={`item-${q.index}`}
                leftIcon={
                  <Checkbox
                    checked={q.checked}
                    width={'20px'}
                    height={'20px'}
                    background="var(--r-green-default, #2ABB7F)"
                    unCheckBackground="var(--r-neutral-line, rgba(255, 255, 255, 0.1))"
                    onChange={handleClickItem}
                  />
                }
                rightIcon={null}
                onClick={handleClickItem}
              >
                {q.content}
              </Field>
            );
          })}
        </FieldList>
      )}
      <Form onFinish={handleSubmit} form={form}>
        <AuthFormItemWrapper>
          <Form.Item
            name="password" // Internal name remains 'password'
            rules={[
              {
                required: true,
                message: t('component.AuthenticationModal.pinRequired', 'PIN code is required'),
              },
              // Add length validation if this modal is always for PIN
              // For now, assuming it might be used for passwords too, so not adding length restriction here
              // but changing type to 'tel' if it's primarily for PINs now.
              // Let's assume it should align with PIN usage:
              {
                len: 6, // Assuming PIN_CODE_LENGTH is 6
                message: t('component.AuthenticationModal.pinLength', 'PIN code must be 6 digits'),
              },
              {
                pattern: /^[0-9]+$/,
                message: t('component.AuthenticationModal.pinNumeric', 'PIN code must be numeric'),
              }
            ]}
          >
            <Input
              className="popup-input"
              placeholder={
                placeholder ??
                t('component.AuthenticationModal.pinPlaceholder', 'Enter 6-digit PIN code')
              }
              type="tel" // Changed type to 'tel' for PIN
              maxLength={6} // Added maxLength for PIN
              size="large"
              autoFocus={!isTab}
              ref={inputRef}
              spellCheck={false}
            />
          </Form.Item>
        </AuthFormItemWrapper>
        <div
          className={clsx(
            'flex pt-6 popup-footer px-20',
            cancelText ? 'justify-between' : 'justify-center'
          )}
        >
          {cancelText && (
            <Button
              size="large"
              type="primary"
              className="w-[172px] rabby-btn-ghost"
              ghost
              onClick={handleCancel}
            >
              {cancelText}
            </Button>
          )}
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            className={clsx(cancelText ? 'w-[172px]' : 'w-[200px]')}
            disabled={checklist.length > 0 ? !isAllChecked : false}
          >
            {confirmText}
          </Button>
        </div>
      </Form>
    </Popup>
  );
};

const AuthenticationModalPromise = wrapModalPromise<AuthenticationModalProps>(
  AuthenticationModal
);

export default AuthenticationModalPromise;
