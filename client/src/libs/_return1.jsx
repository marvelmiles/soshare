<Box
  key={url}
  className={`data-scrollable ${className}`}
  ref={containerRef}
  component={Component}
  {...componentProps}
  sx={{
    position: "relative",
    overflow: "hidden",
    flex: 1,
    width: "100%",
    "&,.data-scrollable-content": {
      display: "flex",
      flexDirection: "column",
      justifyContent: fullHeight ? "center" : "normal",
      flexDirection: "column",
      height: "inherit",
      minHeight: "inherit"
    },
    ".data-scrollabe-main": {
      display: "flex",
      flexDirection: "column",
      flex: loading ? 0 : !data.data.length && centerOnEmpty ? 1 : 0
    },
    ...sx
  }}
>
  {notifierDelay > -1 && (withOverflowShowNotifierOnly ? showEnd : true) ? (
    <NotifierComponent
      containerRef={scrollContRef}
      {...notifierProps}
      open={notifier.open}
      data={notifier.data}
      message={notifier.message}
      closeNotifier={closeNotifier}
    />
  ) : null}

  <div
    className="data-scrollable-content"
    style={{
      flex: "none",
      ...contentSx,
      border: "1px solid red"
    }}
  >
    <div className="data-scrollabe-main">
      {nullifyChildren ? null : children(propMemo)}
      <div
        style={{ border: "1px solid transparent" }}
        ref={observedNodeRef}
      ></div>
    </div>

    <div style={{ padding: "4px 0" }}>
      {hasReachedMaxUserRetry || (showRetryMsg && nullifyChildren) ? (
        <EmptyData nullifyBrand withReload onClick={handleRefetch} />
      ) : showRetryMsg ? (
        <EmptyData
          sx={{
            height: "80px",
            minHeight: "80px"
          }}
          onClick={handleRefetch}
        />
      ) : loading ? (
        <Loading className={"custom-loading"} />
      ) : data.data.length ? (
        reachedMax ? (
          maxSizeElement
        ) : isEnd && (withOverflowShowEndOnly ? showEnd : true) ? (
          endElement
        ) : null
      ) : null}
    </div>
  </div>
</Box>;
