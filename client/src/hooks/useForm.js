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

const useForm = (config = {}) => {
  const [
    { placeholders = {}, required, returnFormObject },
    setConfig
  ] = useState(config);
  const [stateChanged, setStateChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(null);
  const [formData, setFormData] = useState(placeholders || {});
  const [errors, setErrors] = useState({});
  const form = useMemo(() => (returnFormObject ? new FormData() : undefined), [
    returnFormObject
  ]);

  const handleSubmit = useCallback(
    e => {
      if (e?.target) e.preventDefault();
      let _errors = {
        ...errors
      };
      for (let key in formData) {
        const isBool =
          required === undefined || required === true || required[key];
        if (!formData[key] && isBool) {
          _errors[key] = isBool ? "required" : required[key];
        } else if (errors[key] !== "Strong password") {
          delete _errors[key];
          if (form) form.append(key, formData[key]);
        }
      }
      const hasError = Object.keys(_errors).length;
      !hasError && setIsSubmitting(true);
      setErrors(_errors);
      return hasError ? null : form || formData;
    },
    [errors, formData, required, form]
  );

  const handleChange = e => {
    const key = e.target.name;
    const value =
      e.currentTarget.type === "file"
        ? e.currentTarget.multiple
          ? e.currentTarget.files
          : e.currentTarget.files[0]
        : e.currentTarget.value;
    setIsSubmitting(false);
    setStateChanged(true);
    setFormData({
      ...formData,
      [key]: value
    });
    if (
      !value &&
      (required === undefined || typeof required === "boolean" || required[key])
    ) {
      return setErrors({
        ...errors,
        [key]: "required"
      });
    }
    let isValid = true;
    if (key === "email") {
      if (!isEmail(value)) {
        isValid = false;
        setErrors({
          ...errors,
          [key]: "Invalid Email"
        });
      }
    } else if (key === "fullname") {
      if (!isFullName(value)) {
        isValid = false;
        setErrors({
          ...errors,
          [key]: "Name must be separated by space"
        });
      }
    } else if (key === "phone") {
      if (!isNumber(value)) {
        isValid = false;
        setErrors({
          ...errors,
          [key]: "Invalid phone number"
        });
      }
    } else if (key === "password") {
      const status = isPassword(value);
      if (status !== "Strong") {
        isValid = false;
        setErrors({
          ...errors,
          [key]: `${status} password`
        });
      }
    }
    if (isValid) {
      delete errors[key];
      setErrors(errors);
    }
  };
  const reset = useCallback((formData, config) => {
    setStateChanged(false);
    setIsSubmitting(false);
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
    formData,
    errors,
    isSubmitting,
    stateChanged,
    handleChange,
    handleSubmit,
    reset
  };
};

export default useForm;
