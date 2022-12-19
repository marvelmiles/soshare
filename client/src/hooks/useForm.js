import { useState, useCallback, useMemo } from "react";

export const isEmail = str => {
  return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(
    str
  );
};
export const isFullName = str => {
  return /\w+(\s|-|')+\w+/.test(str);
};

export const isNumber = str => {
  return /(\d+){10,13}/.test(str);
};

export const isPassword = str => {
  let strongPassword = new RegExp(
    "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})"
  );
  let mediumPassword = new RegExp(
    "((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{6,}))|((?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}))"
  );
  if (strongPassword.test(str)) return "Strong";
  else if (mediumPassword.test(str)) return "Medium";
  else return "Weak";
};

export const isLink = str => {
  return true;
};

const useForm = (config = {}) => {
  const [
    { placeholders, required, exclude, returnFormObject },
    setConfig
  ] = useState(config);
  const [stateChanged, setStateChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(null);
  const [formData, setFormData] = useState(placeholders);
  const [errors, setErrors] = useState({});
  const form = useMemo(() => (returnFormObject ? new FormData() : undefined), [
    returnFormObject
  ]);

  const handleSubmit = useCallback(
    e => {
      if (e?.target) e.preventDefault();
      if (stateChanged || required) {
        let _errors = {
          ...errors
        };
        if (formData) {
          for (let key in formData) {
            const isBool =
              (exclude && !exclude[key]) ||
              required === undefined ||
              required === true ||
              required[key];
            if (!formData[key] && isBool) {
              _errors[key] = isBool ? "required" : required[key];
            } else if (errors[key] !== "Strong password") {
              delete _errors[key];
              if (form) form.append(key, formData[key]);
            }
          }
        } else if (required === undefined || required === true)
          _errors.all = true;
        else if (required) {
          for (const key in required) {
            _errors[key] = required[key] || "required";
          }
        }
        const hasError = Object.keys(_errors).length;
        !hasError && setIsSubmitting(true);
        setErrors(_errors);
        return hasError ? null : form || formData;
      }
      return null;
    },
    [stateChanged, errors, formData, required, exclude, form]
  );

  const handleChange = (e, validate) => {
    const key = (e.currentTarget || e.target).name;
    const value =
      (e.currentTarget || e.target).type === "file"
        ? (e.currentTarget || e.target).multiple
          ? (e.currentTarget || e.target).files
          : (e.currentTarget || e.target).files[0] ||
            (e.currentTarget || e.target).files
        : (e.currentTarget || e.target).value;
    setIsSubmitting(false);
    setStateChanged(true);
    setFormData({
      ...formData,
      [key]: value
    });
    if (
      !value &&
      (required === undefined || required === true || required[key])
    ) {
      return setErrors({
        ...errors,
        [key]: "required"
      });
    }
    let isValid = true;
    if (value) {
      switch (key) {
        case "email":
          if (!isEmail(value)) {
            isValid = false;
            setErrors({
              ...errors,
              [key]: "Invalid Email"
            });
          }
          break;
        case "fullname":
          if (!isFullName(value)) {
            isValid = false;
            setErrors({
              ...errors,
              [key]: "Name must be separated by space"
            });
          }
          break;
        case "phone":
          if (!isNumber(value)) {
            isValid = false;
            setErrors({
              ...errors,
              [key]: "Invalid phone number"
            });
          }
          break;
        case "password":
          const status = isPassword(value);
          if (status !== "Strong") {
            isValid = false;
            setErrors({
              ...errors,
              [key]: `${status} password`
            });
          }
          break;
        default:
          const error = validate(key, value);
          isValid = !error;
          if (error)
            setErrors({
              ...errors,
              [key]: error
            });
      }
    }

    if (isValid) {
      delete errors[key];
      setErrors(errors);
    }
    return isValid;
  };
  const reset = useCallback((formData, config) => {
    setStateChanged(false);
    setIsSubmitting(formData === "submitting");
    if (config) {
      setConfig(prev => ({
        ...prev,
        required:
          typeof config.required === "boolean"
            ? config.required
            : {
                ...prev.required,
                ...config.required
              }
      }));
    }
    if (
      typeof formData === "object" &&
      formData.toString() === "[object Object]"
    ) {
      setFormData(formData);
    } else if (!formData) setFormData({});
  }, []);
  return {
    formData: formData || {},
    errors,
    isSubmitting,
    stateChanged,
    handleChange,
    handleSubmit,
    reset
  };
};

export default useForm;
